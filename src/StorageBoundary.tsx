import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "./Button";
import { ResilientStorage, type StorageBackend } from "./resilientStorage";

export function StorageBoundary({
  storage: suppliedStorage,
  children,
}: {
  storage?: StorageBackend;
  children: (storage: ResilientStorage) => ReactNode;
}) {
  const [storage] = useState(
    () =>
      new ResilientStorage(suppliedStorage ? () => suppliedStorage : undefined),
  );
  const unavailable = useSyncExternalStore(
    storage.subscribe,
    storage.getSnapshot,
  );

  return (
    <>
      {unavailable ? (
        <aside
          className="border-rule bg-surface-warm text-ink border-b p-4 text-sm"
          aria-label="Storage warning"
        >
          <p role="status" className="mb-2">
            Device storage is unavailable. You can keep playing, but progress
            and erasures may not be saved after you leave this session.
          </p>
          <Button onClick={storage.retry}>Retry saving</Button>
        </aside>
      ) : null}
      {children(storage)}
    </>
  );
}
