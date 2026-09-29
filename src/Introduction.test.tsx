import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Introduction } from "./Introduction";
import styles from "./Introduction.module.css";

const props = {
  title: "Note navigation",
  instruction: "Find the note — then listen. Keep your place!",
  theoryTip: "A fifth spans five letter names; C → G is a fifth.",
  onBack: vi.fn(),
  onContinue: vi.fn(),
};

describe("Introduction", () => {
  it("preserves the title, instruction and Music theory tip verbatim", () => {
    render(<Introduction {...props} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      props.title,
    );
    expect(screen.getByText(props.instruction).textContent).toBe(
      props.instruction,
    );
    const theory = screen.getByRole("complementary");
    expect(
      within(theory).getByRole("heading", { name: "Music theory" }),
    ).toBeInTheDocument();
    expect(within(theory).getByText(props.theoryTip).textContent).toBe(
      props.theoryTip,
    );
    expect(
      screen.queryByRole("heading", { name: "Your skills" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sound unlocks" }),
    ).not.toBeInTheDocument();
  });

  it.each(["succeeded", "failed"] as const)(
    "summarizes a %s run in place of instructions and offers Play again",
    (status) => {
      const onContinue = vi.fn();
      render(
        <Introduction
          {...props}
          onContinue={onContinue}
          runSummary={{ status, puzzlesPlayed: 12 }}
          skills={[
            {
              label: "Pitch direction",
              proficiency: 0.55,
              previousProficiency: 0.42,
            },
          ]}
        />,
      );
      expect(
        screen.getByRole("heading", { level: 1, name: props.title }),
      ).toBeInTheDocument();
      expect(screen.queryByText(props.instruction)).not.toBeInTheDocument();
      expect(
        screen.getByText(
          `${status === "succeeded" ? "Run complete" : "Run ended"} · 12 puzzles played.`,
        ),
      ).toBeInTheDocument();
      const skill = screen.getByText("Pitch direction").parentElement;
      expect(skill).toHaveTextContent(/Before run:.*42%.*now:.*55%/);
      fireEvent.click(screen.getByRole("button", { name: "Play again" }));
      expect(onContinue).toHaveBeenCalledOnce();
    },
  );

  it("places the unchanged theory tip after the main button on both visits", () => {
    const { rerender } = render(<Introduction {...props} />);
    const theory = screen.getByRole("complementary");
    expect(
      screen
        .getByRole("button", { name: "Start" })
        .compareDocumentPosition(theory) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    rerender(
      <Introduction
        {...props}
        runSummary={{ status: "failed", puzzlesPlayed: 1 }}
      />,
    );
    expect(
      screen.getByText("Run ended · 1 puzzle played."),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: "Play again" })
        .compareDocumentPosition(theory) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(theory).getByText(props.theoryTip)).toBeInTheDocument();
    rerender(<Introduction {...props} />);
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByText(props.instruction)).toBeInTheDocument();
  });

  it("starts, goes back and preserves the status message", () => {
    const onBack = vi.fn();
    const onContinue = vi.fn();
    render(
      <Introduction
        {...props}
        onBack={onBack}
        onContinue={onContinue}
        message="Ready to listen."
      />,
    );

    const start = screen.getByRole("button", { name: "Start" });
    expect(start).toBeEnabled();
    fireEvent.click(start);
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Ready to listen.");
  });

  it("shows the supplied icon and individual current skill percentages", () => {
    const { rerender } = render(
      <Introduction
        {...props}
        icon={<svg data-testid="icon" />}
        skills={[
          { label: "Pitch direction", proficiency: 0.426 },
          { label: "Interval size", proficiency: 0 },
          { label: "Pitch navigation", proficiency: 1 },
        ]}
      />,
    );

    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const skills = screen.getByRole("region", { name: "Your skills" });
    for (const [label, percentage] of [
      ["Pitch direction", "43%"],
      ["Interval size", "0%"],
      ["Pitch navigation", "100%"],
    ]) {
      expect(within(skills).getByText(label).parentElement).toHaveTextContent(
        `${label}${percentage}`,
      );
    }
    rerender(
      <Introduction
        {...props}
        skills={[{ label: "Pitch direction", proficiency: 0.51 }]}
      />,
    );
    expect(
      within(screen.getByRole("region", { name: "Your skills" })).getByText(
        "51%",
      ),
    ).toBeInTheDocument();
  });

  it("shows informational milestones with an accessible final diamond, not earned progress", () => {
    render(
      <Introduction
        {...props}
        skills={[{ label: "Pitch direction", proficiency: 1 }]}
      />,
    );

    const track = screen.getByRole("region", { name: "Sound unlocks" });
    const milestones = within(track).getAllByRole("listitem");
    expect(milestones.map((item) => item.textContent)).toEqual([
      "33%",
      "66%",
      "100%",
    ]);
    expect(
      within(milestones[2]).getByRole("img", {
        name: "Final milestone: diamond",
      }),
    ).toHaveClass(styles.finalMarker);
    expect(within(track).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      within(track).queryByText(/earned|unlocked/i),
    ).not.toBeInTheDocument();
  });

  it("omits skills and unlocks for an empty skill list", () => {
    render(<Introduction {...props} skills={[]} />);
    expect(
      screen.queryByRole("region", { name: "Your skills" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Sound unlocks" }),
    ).not.toBeInTheDocument();
  });

  it("disables Start with an accessible lock reason while keeping Back available", () => {
    const onContinue = vi.fn();
    const onBack = vi.fn();
    const { rerender } = render(
      <Introduction
        {...props}
        onContinue={onContinue}
        onBack={onBack}
        lockedReason="Complete note navigation first."
        message="Your session is ready."
      />,
    );
    const start = screen.getByRole("button", { name: "Start" });
    expect(start).toBeDisabled();
    expect(start).toHaveAccessibleDescription(
      "Complete note navigation first.",
    );
    expect(screen.getByText("Complete note navigation first.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your session is ready.",
    );
    fireEvent.click(start);
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(onBack).toHaveBeenCalledOnce();

    rerender(<Introduction {...props} onContinue={onContinue} />);
    expect(start).toBeEnabled();
    expect(start).not.toHaveAttribute("aria-describedby");
    expect(
      screen.queryByText("Complete note navigation first."),
    ).not.toBeInTheDocument();
  });
});
