import { describe, expect, it, vi } from "vitest";

import { ResilientStorage, type StorageBackend } from "./resilientStorage";

function backend() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
}

describe("ResilientStorage", () => {
  it("catches storage access and read failures, then retries reads", () => {
    const disk = backend();
    disk.values.set("profile", "saved");
    const access = vi.fn<() => StorageBackend>(() => {
      throw new Error("denied");
    });
    const storage = new ResilientStorage(access);
    expect(storage.getItem("profile")).toBeNull();
    expect(storage.getSnapshot()).toBe(true);
    access.mockImplementation(() => disk);
    disk.getItem.mockImplementationOnce(() => {
      throw new Error("read");
    });
    storage.retry();
    expect(storage.getSnapshot()).toBe(true);
    storage.retry();
    expect(storage.getItem("profile")).toBe("saved");
    expect(storage.getSnapshot()).toBe(false);
  });

  it("keeps the newest failed write instead of rereading stale data and recovers all keys", () => {
    const disk = backend();
    disk.values.set("profile", "old");
    const storage = new ResilientStorage(() => disk);
    expect(storage.getItem("profile")).toBe("old");
    disk.setItem.mockImplementation(() => {
      throw new Error("quota");
    });
    storage.setItem("profile", "new");
    storage.setItem("profile", "newest");
    storage.setItem("unlocks", "earned");
    expect(storage.getItem("profile")).toBe("newest");
    expect(storage.getItem("unlocks")).toBe("earned");
    disk.setItem.mockImplementation((key, value) => {
      disk.values.set(key, value);
    });
    storage.setItem("other", "ok");
    expect(storage.getSnapshot()).toBe(true);
    storage.retry();
    expect(disk.values.get("profile")).toBe("newest");
    expect(disk.values.get("unlocks")).toBe("earned");
    expect(storage.getSnapshot()).toBe(false);
  });

  it("keeps failed deletions as tombstones and retries without resurrecting data", () => {
    const disk = backend();
    disk.values.set("profile", "old");
    const storage = new ResilientStorage(() => disk);
    disk.removeItem.mockImplementationOnce(() => {
      throw new Error("denied");
    });
    storage.removeItem("profile");
    expect(storage.getItem("profile")).toBeNull();
    expect(storage.getSnapshot()).toBe(true);
    storage.retry();
    expect(disk.values.has("profile")).toBe(false);
    expect(storage.getSnapshot()).toBe(false);
  });

  it("refreshes healthy reads and uses the last known value when reads fail", () => {
    const disk = backend();
    const storage = new ResilientStorage(() => disk);
    disk.values.set("profile", "first");
    expect(storage.getItem("profile")).toBe("first");
    disk.values.set("profile", "external update");
    expect(storage.getItem("profile")).toBe("external update");
    disk.getItem.mockImplementationOnce(() => {
      throw new Error("read");
    });
    expect(storage.getItem("profile")).toBe("external update");
    expect(storage.getSnapshot()).toBe(true);
    storage.retry();
    expect(storage.getSnapshot()).toBe(false);
  });

  it("does not share fallback values between instances", () => {
    const access = () => {
      throw new Error("denied");
    };
    const first = new ResilientStorage(access);
    first.setItem("profile", "session");
    expect(new ResilientStorage(access).getItem("profile")).toBeNull();
  });

  it("reports unsupported removals and notifies subscribed views", () => {
    const disk = backend();
    const storage = new ResilientStorage(() => ({
      getItem: disk.getItem,
      setItem: disk.setItem,
    }));
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);
    storage.removeItem("profile");
    expect(storage.getSnapshot()).toBe(true);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    storage.retry();
    expect(listener).not.toHaveBeenCalled();
  });
});
