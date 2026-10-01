export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/** Unsaved session values take precedence over disk, including failed deletions. */
export class ResilientStorage implements StorageBackend {
  private readonly values = new Map<string, string | null>();
  private readonly pending = new Map<string, string | null>();
  private readonly failedReads = new Set<string>();
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly backend: () => StorageBackend = () => window.localStorage,
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.pending.size > 0 || this.failedReads.size > 0;

  private notify() {
    for (const listener of this.listeners) listener();
  }

  getItem(key: string): string | null {
    if (this.pending.has(key)) return this.values.get(key) ?? null;
    try {
      const value = this.backend().getItem(key);
      this.values.set(key, value);
      this.failedReads.delete(key);
      this.notify();
      return value;
    } catch {
      this.failedReads.add(key);
      this.notify();
      return this.values.get(key) ?? null;
    }
  }

  setItem(key: string, value: string): void {
    this.write(key, value);
  }

  removeItem(key: string): void {
    this.write(key, null);
  }

  private write(key: string, value: string | null) {
    this.values.set(key, value);
    this.failedReads.delete(key);
    this.pending.set(key, value);
    this.flush(key, value);
    this.notify();
  }

  private flush(key: string, value: string | null) {
    try {
      const storage = this.backend();
      if (value === null) {
        if (!storage.removeItem) throw new Error("Storage cannot remove items");
        storage.removeItem(key);
      } else {
        storage.setItem(key, value);
      }
      this.pending.delete(key);
    } catch {
      // Keep the latest session value until an explicit retry succeeds.
    }
  }

  retry = () => {
    for (const [key, value] of this.pending) this.flush(key, value);
    for (const key of this.failedReads) this.getItem(key);
    this.notify();
  };
}
