import { answerChoiceCount, buildAnswerChoices } from "./choices";
import {
  NAMED_INTERVALS,
  intervalReminder,
  transposeNamedInterval,
} from "./intervals";
import {
  allDisplayNotes,
  isInDisplayRange,
  noteKey,
  noteToMidi,
  parseNote,
  spellPitch,
  spellingsForMidi,
} from "./notes";
import { choose } from "./random";
import { NOTE_NAVIGATION_TUNING, clamp01 } from "./tuning";
import {
  categoryContainsSemitones,
  navigationMilestoneForDemand,
  type MovementCategory,
} from "./milestones";
import {
  SKILLS,
  type CorrectAnswer,
  type DifficultyControls,
  type Direction,
  type DistanceUnit,
  type GenerationRepertoire,
  type NamedInterval,
  type NavigationQuestion,
  type Rng,
  type Skill,
  type SkillDemand,
  type SubmittedAnswer,
} from "./types";

export interface GenerateQuestionOptions {
  readonly id: string;
  readonly controls: DifficultyControls;
  readonly rng: Rng;
  readonly targetSkill?: Skill;
  readonly skillChallenges?: Partial<Record<Skill, number>>;
  readonly repertoire?: GenerationRepertoire;
}

export interface IntervalDemandLevel {
  readonly numericalOnly: boolean;
  readonly introductionGroup: number;
  readonly numericalReminders: boolean;
  readonly intervals: readonly NamedInterval[];
}

interface Movement {
  readonly category: MovementCategory;
  readonly value: number;
  readonly semitones: number;
}

interface NamedCandidate {
  readonly start: ReturnType<typeof allDisplayNotes>[number];
  readonly end: ReturnType<typeof allDisplayNotes>[number];
  readonly direction: Direction;
  readonly interval: NamedInterval;
  readonly reminderUnit: DistanceUnit;
}

function normalizedControls(controls: DifficultyControls): DifficultyControls {
  return {
    navigationDemand: clamp01(controls.navigationDemand),
    intervalNameDemand: clamp01(controls.intervalNameDemand),
    answerChoiceBreadth: clamp01(controls.answerChoiceBreadth),
  };
}

export function intervalDemandForSetting(demand: number): IntervalDemandLevel {
  const normalized = clamp01(demand);
  const namedStepCount = NOTE_NAVIGATION_TUNING.intervalProgressionSteps;
  const step = Math.min(
    namedStepCount,
    Math.floor(normalized * (namedStepCount + 1)),
  );
  if (step === 0) {
    return {
      numericalOnly: true,
      introductionGroup: 0,
      numericalReminders: false,
      intervals: [],
    };
  }
  const introductionGroup = Math.ceil(step / 2);
  const numericalReminders = step % 2 === 1;
  const intervals = NAMED_INTERVALS.filter((interval) => {
    if (interval.introductionGroup < introductionGroup) return true;
    if (interval.introductionGroup > introductionGroup) return false;
    if (introductionGroup !== 6) return true;
    return numericalReminders ? interval.id === "tritone" : true;
  });
  return {
    numericalOnly: false,
    introductionGroup,
    numericalReminders,
    intervals,
  };
}

function skillChallenge(
  options: GenerateQuestionOptions,
  skill: Skill,
): number {
  return clamp01(
    options.skillChallenges?.[skill] ?? options.controls.navigationDemand,
  );
}

function answerChoiceSupport(breadth: number): number {
  const count = answerChoiceCount(breadth);
  const support = NOTE_NAVIGATION_TUNING.assessment.curatedChoiceSupport;
  if (count === 3) return support.three;
  if (count === 4) return support.four;
  if (count === 6) return support.six;
  return support.full;
}

const fullRepertoire: GenerationRepertoire = {
  octaveCrossings: true,
  edgeEnharmonics: true,
};

function selectedRepertoire(options: GenerateQuestionOptions) {
  return options.repertoire ?? fullRepertoire;
}

function isEdgeEnharmonic(note: ReturnType<typeof allDisplayNotes>[number]) {
  return (
    (note.accidental === "sharp" &&
      (note.letter === "B" || note.letter === "E")) ||
    (note.accidental === "flat" && (note.letter === "C" || note.letter === "F"))
  );
}

function validStartsForMovement(
  movement: Movement,
  repertoire: GenerationRepertoire,
) {
  const sign = movement.category.direction === "up" ? 1 : -1;
  const preference = movement.category.direction === "up" ? "sharp" : "flat";
  const conventionalNotes = Array.from(
    {
      length:
        NOTE_NAVIGATION_TUNING.displayMidiMax -
        NOTE_NAVIGATION_TUNING.displayMidiMin +
        1,
    },
    (_, index) =>
      spellPitch(NOTE_NAVIGATION_TUNING.displayMidiMin + index, preference),
  );
  const starts = repertoire.edgeEnharmonics
    ? [...conventionalNotes, ...allDisplayNotes().filter(isEdgeEnharmonic)]
    : conventionalNotes;

  return starts.filter((note) => {
    const destinationMidi = noteToMidi(note) + sign * movement.semitones;
    if (
      destinationMidi < NOTE_NAVIGATION_TUNING.displayMidiMin ||
      destinationMidi > NOTE_NAVIGATION_TUNING.displayMidiMax
    ) {
      return false;
    }
    if (repertoire.octaveCrossings) return true;
    return spellPitch(destinationMidi, preference).octave === note.octave;
  });
}

function chooseMovement(
  controls: DifficultyControls,
  rng: Rng,
  repertoire: GenerationRepertoire,
): Movement {
  const categories = navigationMilestoneForDemand(
    controls.navigationDemand,
  ).categories.map((category) => {
    const movements = Array.from(
      { length: category.maximum - category.minimum + 1 },
      (_, index) => {
        const value = category.minimum + index;
        return {
          category,
          value,
          semitones: category.unit === "wholeTones" ? value * 2 : value,
        } satisfies Movement;
      },
    ).filter(
      (movement) => validStartsForMovement(movement, repertoire).length > 0,
    );
    return { category, movements };
  });
  const availableCategories = categories.filter(
    ({ movements }) => movements.length > 0,
  );
  return choose(choose(availableCategories, rng).movements, rng);
}

function keyboardMode(options: GenerateQuestionOptions) {
  return selectedRepertoire(options).octaveCrossings
    ? ("fullRange" as const)
    : ("singleRegister" as const);
}

function numericalDestinationQuestion(
  options: GenerateQuestionOptions,
  controls: DifficultyControls,
): NavigationQuestion {
  const repertoire = selectedRepertoire(options);
  const movement = chooseMovement(controls, options.rng, repertoire);
  const start = choose(
    validStartsForMovement(movement, repertoire),
    options.rng,
  );
  const sign = movement.category.direction === "up" ? 1 : -1;
  const destinationMidi = noteToMidi(start) + sign * movement.semitones;
  const destination = spellPitch(
    destinationMidi,
    movement.category.direction === "up" ? "sharp" : "flat",
  );
  const answer: CorrectAnswer = {
    kind: "note",
    note: destination,
    acceptedSpellings: spellingsForMidi(destinationMidi).map(noteKey),
  };
  const demands: SkillDemand[] = [
    {
      skill: "numericalDestination",
      weight: 1,
      support: answerChoiceSupport(controls.answerChoiceBreadth),
      challenge: skillChallenge(options, "numericalDestination"),
    },
  ];
  return {
    id: options.id,
    form: "forward",
    direction: movement.category.direction,
    start,
    instruction: {
      kind: "numerical",
      value: movement.value,
      unit: movement.category.unit,
    },
    requestedAnswer: "note",
    answer,
    keyboardMode: keyboardMode(options),
    choices: buildAnswerChoices(
      answer,
      controls.answerChoiceBreadth,
      options.rng,
    ),
    controls,
    demands,
  };
}

function numericalDistanceQuestion(
  options: GenerateQuestionOptions,
  controls: DifficultyControls,
): NavigationQuestion {
  const repertoire = selectedRepertoire(options);
  const movement = chooseMovement(controls, options.rng, repertoire);
  const start = choose(
    validStartsForMovement(movement, repertoire),
    options.rng,
  );
  const sign = movement.category.direction === "up" ? 1 : -1;
  const end = spellPitch(
    noteToMidi(start) + sign * movement.semitones,
    movement.category.direction === "up" ? "sharp" : "flat",
  );
  const answer: CorrectAnswer = {
    kind: "numericalDistance",
    value: movement.value,
    unit: movement.category.unit,
  };
  return {
    id: options.id,
    form: "reverse",
    direction: movement.category.direction,
    start,
    end,
    instruction: { kind: "identifyNumerical", unit: movement.category.unit },
    requestedAnswer: "numericalDistance",
    answer,
    keyboardMode: keyboardMode(options),
    choices: buildAnswerChoices(
      answer,
      controls.answerChoiceBreadth,
      options.rng,
    ),
    controls,
    demands: [
      {
        skill: "numericalDistance",
        weight: 1,
        support: answerChoiceSupport(controls.answerChoiceBreadth),
        challenge: skillChallenge(options, "numericalDistance"),
      },
    ],
  };
}

function namedCandidates(
  controls: DifficultyControls,
  repertoire: GenerationRepertoire,
): NamedCandidate[] {
  const demand = intervalDemandForSetting(controls.intervalNameDemand);
  const categories = navigationMilestoneForDemand(
    controls.navigationDemand,
  ).categories;
  const candidates: NamedCandidate[] = [];

  for (const interval of demand.intervals) {
    for (const direction of ["up", "down"] as const) {
      const supportingCategory = categories.find(
        (category) =>
          category.direction === direction &&
          categoryContainsSemitones(category, interval.semitones),
      );
      if (supportingCategory === undefined) continue;
      for (const start of allDisplayNotes()) {
        const end = transposeNamedInterval(start, interval, direction);
        if (end === null || !isInDisplayRange(end)) continue;
        if (
          !repertoire.edgeEnharmonics &&
          (isEdgeEnharmonic(start) || isEdgeEnharmonic(end))
        ) {
          continue;
        }
        if (!repertoire.octaveCrossings && start.octave !== end.octave) {
          continue;
        }
        candidates.push({
          start,
          end,
          direction,
          interval,
          reminderUnit: supportingCategory.unit,
        });
      }
    }
  }
  return candidates;
}

function namedQuestion(
  options: GenerateQuestionOptions,
  controls: DifficultyControls,
  form: "forward" | "reverse",
): NavigationQuestion | null {
  const demand = intervalDemandForSetting(controls.intervalNameDemand);
  const candidates = namedCandidates(controls, selectedRepertoire(options));
  if (demand.numericalOnly || candidates.length === 0) return null;
  const candidate = choose(candidates, options.rng);
  const specificTritone =
    candidate.interval.id === "A4" || candidate.interval.id === "d5";
  const answer: CorrectAnswer =
    form === "forward"
      ? {
          kind: "note",
          note: candidate.end,
          acceptedSpellings:
            candidate.interval.id === "tritone"
              ? spellingsForMidi(noteToMidi(candidate.end)).map(noteKey)
              : [noteKey(candidate.end)],
        }
      : { kind: "namedInterval", interval: candidate.interval };
  const numericalSkill: Skill =
    form === "forward" ? "numericalDestination" : "numericalDistance";
  const intervalSkill: Skill =
    form === "forward" ? "intervalInterpretation" : "intervalIdentification";
  const choiceSupport = answerChoiceSupport(controls.answerChoiceBreadth);
  const assessmentTuning = NOTE_NAVIGATION_TUNING.assessment;
  const demands: SkillDemand[] = [
    {
      skill: numericalSkill,
      weight: demand.numericalReminders
        ? 1
        : assessmentTuning.unsupportedNamedNumericalWeight,
      support: choiceSupport,
      challenge: skillChallenge(options, numericalSkill),
    },
    {
      skill: intervalSkill,
      weight: demand.numericalReminders
        ? 0
        : assessmentTuning.unsupportedNamedVocabularyWeight,
      support: demand.numericalReminders ? 1 : choiceSupport,
      challenge: skillChallenge(options, intervalSkill),
    },
  ];

  return {
    id: options.id,
    form,
    direction: candidate.direction,
    start: candidate.start,
    ...(form === "reverse" ? { end: candidate.end } : {}),
    instruction:
      form === "forward"
        ? {
            kind: "namedInterval",
            interval: candidate.interval,
            ...(demand.numericalReminders
              ? {
                  numericalReminder: intervalReminder(
                    candidate.interval,
                    candidate.reminderUnit,
                  ),
                }
              : {}),
            requireSpecificTritoneSpelling: specificTritone,
          }
        : {
            kind: "identifyNamedInterval",
            numericalReminders: demand.numericalReminders,
            requireSpecificTritoneSpelling: specificTritone,
          },
    requestedAnswer: answer.kind,
    answer,
    keyboardMode: keyboardMode(options),
    choices: buildAnswerChoices(
      answer,
      controls.answerChoiceBreadth,
      options.rng,
      demand.numericalReminders ? candidate.reminderUnit : undefined,
    ),
    controls,
    demands,
  };
}

export function generateQuestion(
  options: GenerateQuestionOptions,
): NavigationQuestion {
  const controls = normalizedControls(options.controls);
  const targetSkill = options.targetSkill ?? choose(SKILLS, options.rng);
  if (targetSkill === "intervalInterpretation") {
    return (
      namedQuestion(options, controls, "forward") ??
      numericalDestinationQuestion(options, controls)
    );
  }
  if (targetSkill === "intervalIdentification") {
    return (
      namedQuestion(options, controls, "reverse") ??
      numericalDistanceQuestion(options, controls)
    );
  }
  return targetSkill === "numericalDestination"
    ? numericalDestinationQuestion(options, controls)
    : numericalDistanceQuestion(options, controls);
}

export function isCorrectAnswer(
  question: NavigationQuestion,
  submitted: SubmittedAnswer,
): boolean {
  if (question.answer.kind !== submitted.kind) return false;
  if (question.answer.kind === "note" && submitted.kind === "note") {
    try {
      const note =
        typeof submitted.value === "string"
          ? parseNote(submitted.value)
          : submitted.value;
      return question.answer.acceptedSpellings.includes(noteKey(note));
    } catch {
      return false;
    }
  }
  if (
    question.answer.kind === "numericalDistance" &&
    submitted.kind === "numericalDistance"
  ) {
    return question.answer.value === submitted.value;
  }
  if (
    question.answer.kind === "namedInterval" &&
    submitted.kind === "namedInterval"
  ) {
    return question.answer.interval.id === submitted.value;
  }
  return false;
}
