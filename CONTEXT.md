# Learning game

## Language

**Director**:
The shared system that targets puzzle-type skills for challenge during a run and selects puzzles through that puzzle type's question forms and difficulty controls. Overall skills do not tune the run.

**Run**:
A limited-mistake attempt at a puzzle type, with personalized, escalating challenge. Learning progress carries across runs.

**Puzzle-type skill**:
A task-specific ability assessed within one puzzle type through a proficiency estimate and certainty. Runs target puzzle-type skills directly. A puzzle-type skill is distinct from the controls used to generate questions that exercise it.

**Overall skill**:
A curriculum-aligned musical ability estimated from one or more puzzle-type skills. Preserve each contributing puzzle-type skill estimate as an identifiable source and derive the combined estimate used for unlocks. Contribution is a deliberate yes-or-no mapping, not a graded coverage label. Split an overall skill when its constituent abilities need to gate future puzzle types independently, not merely because question forms assess it differently. Overall skills support persistent learning progress and puzzle-type unlocks; they do not tune difficulty or provide transfer evidence back to puzzle-type profiles or active runs.

**Skill**:
Use the qualified term _puzzle-type skill_ or _overall skill_ when the distinction matters. Do not use _skill_ for a difficulty control.
_Avoid_: Constraint, when the intended meaning could instead be a tracked skill.

**Difficulty control**:
A generation parameter whose setting ranges from 0 to 1. Its effect on puzzle-type skill demands depends on the question form and supplied support; it need not correspond one-to-one with a tracked skill.
_Avoid_: Constraint, when the intended meaning could instead be a tracked skill.

**Question form**:
The task a puzzle asks the player to perform, such as finding a destination note or identifying a distance between notes.

**Support**:
Information supplied to help solve a puzzle. Knowledge supplied by support is not independently demonstrated by a correct answer.

**Proficiency**:
The player's estimated ability with a particular skill, distinct from a puzzle's current difficulty settings.

**Certainty**:
The confidence in the current evaluation of a player's proficiency with a particular skill.

**Run balance**:
The stable relative emphasis chosen by the director at the start of a run, expressing which puzzle-type skills it aims to challenge. Puzzle-specific rules translate that intent into question forms and difficulty settings.

**Focus**:
The puzzle-type skills the director aims to challenge more over the course of a run. Focus is not defined solely by how frequently a skill is exercised.

**Familiarity**:
Per-puzzle-type-skill readiness for mixed focus, established by demonstrated success at a modest difficulty with sufficient certainty, rather than exposure alone.
