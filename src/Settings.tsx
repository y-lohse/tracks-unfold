import { useState } from "react";

import { Button } from "./Button";

type SettingsProps = {
  onBack: () => void;
  onEraseProgress: () => void;
};

export function Settings({ onBack, onEraseProgress }: SettingsProps) {
  const [confirming, setConfirming] = useState(false);
  const [erased, setErased] = useState(false);

  return (
    <main className="bg-canvas text-ink flex min-h-svh justify-center px-6 py-8">
      <div className="flex w-full max-w-md flex-col justify-center">
        <button
          className="text-muted focus-visible:outline-accent w-fit cursor-pointer py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={onBack}
          type="button"
        >
          ← Back
        </button>
        <h1 className="mt-10 mb-5 text-2xl font-semibold">Settings</h1>
        <p className="text-muted text-sm leading-relaxed">
          Erase all progress for Navigation and Imitation on this device.
        </p>
        {confirming ? (
          <div className="mt-8 grid gap-3">
            <p className="text-muted text-sm">This cannot be undone.</p>
            <Button
              onClick={() => {
                onEraseProgress();
                setErased(true);
                setConfirming(false);
              }}
            >
              Confirm erase all progress
            </Button>
            <button
              className="text-muted focus-visible:outline-accent cursor-pointer py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={() => setConfirming(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button className="mt-8" onClick={() => setConfirming(true)}>
            Erase all progress
          </Button>
        )}
        {erased ? (
          <p className="text-muted mt-4 text-sm" role="status">
            All progress erased.
          </p>
        ) : null}
      </div>
    </main>
  );
}
