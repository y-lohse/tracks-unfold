import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PuzzleKeyboard } from "./PuzzleKeyboard";

describe("PuzzleKeyboard", () => {
  it("preserves the question's enharmonic spelling on the key", () => {
    render(
      <PuzzleKeyboard
        destination={{ letter: "D", accidental: "natural", octave: 4 }}
        revealDestinationLabel={false}
        start={{ letter: "B", accidental: "sharp", octave: 3 }}
      />,
    );

    expect(screen.getByText("B♯3")).toBeInTheDocument();
    expect(screen.queryByText("C4")).not.toBeInTheDocument();
  });
});
