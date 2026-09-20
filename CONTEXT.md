# Learning game

## Language

**Director**:
The shared system that targets skills for challenge during a run and selects puzzles through a puzzle type's question forms and difficulty controls.

**Run**:
A limited-mistake attempt at a puzzle type, with personalized, escalating challenge. Learning progress carries across runs.

**Skill**:
An ability the game tracks through a proficiency estimate and certainty. A skill is distinct from the controls used to generate a puzzle that exercises it.

**Difficulty control**:
A generation parameter whose setting ranges from 0 to 1. Its effect on skill demands depends on the question form and supplied support; it need not correspond one-to-one with a tracked skill.
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
The stable relative emphasis chosen by the director at the start of a run, expressing which skills it aims to challenge. Puzzle-specific rules translate that intent into question forms and difficulty settings.

**Focus**:
The skills the director aims to challenge more over the course of a run. Focus is not defined solely by how frequently a skill is exercised.

**Familiarity**:
Per-skill readiness for mixed focus, established by demonstrated success at a modest difficulty with sufficient certainty, rather than exposure alone.
