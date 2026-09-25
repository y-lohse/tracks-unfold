import type {
  RunProfile,
  RunState as SharedRunState,
  RunStatus as SharedRunStatus,
  SkillAssessment as SharedSkillAssessment,
} from "../run/director";

export const SKILLS = [
  "numericalDestination",
  "numericalDistance",
  "intervalInterpretation",
  "intervalIdentification",
] as const;

export type Skill = (typeof SKILLS)[number];

export type Direction = "up" | "down";
export type DistanceUnit = "semitones" | "wholeTones";
export type QuestionForm = "forward" | "reverse";
export type Accidental = "flat" | "natural" | "sharp";
export type NoteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface Note {
  readonly letter: NoteLetter;
  readonly accidental: Accidental;
  readonly octave: number;
}

export type IntervalId =
  | "m2"
  | "M2"
  | "m3"
  | "M3"
  | "P4"
  | "A4"
  | "d5"
  | "P5"
  | "m6"
  | "M6"
  | "m7"
  | "M7"
  | "P8"
  | "tritone";

export interface NamedInterval {
  readonly id: IntervalId;
  readonly name: string;
  readonly semitones: number;
  readonly number: number | null;
  readonly introductionGroup: number;
}

export interface DifficultyControls {
  readonly navigationDemand: number;
  readonly intervalNameDemand: number;
  readonly answerChoiceBreadth: number;
}

export interface GenerationRepertoire {
  readonly octaveCrossings: boolean;
  readonly edgeEnharmonics: boolean;
}

export type SkillAssessment = SharedSkillAssessment;

export type PlayerProfile = RunProfile<Skill>;

export interface SkillDemand {
  readonly skill: Skill;
  readonly weight: number;
  /** The fraction of this skill supplied by the question rather than recalled. */
  readonly support: number;
  readonly challenge: number;
}

export type NoteChoice = {
  readonly kind: "note";
  readonly id: string;
  readonly note: Note;
  readonly label: string;
};

export type NumericalChoice = {
  readonly kind: "numericalDistance";
  readonly id: string;
  readonly value: number;
  readonly unit: DistanceUnit;
  readonly label: string;
};

export type IntervalChoice = {
  readonly kind: "namedInterval";
  readonly id: IntervalId;
  readonly interval: NamedInterval;
  readonly label: string;
  readonly reminder?: string;
};

export type AnswerChoice = NoteChoice | NumericalChoice | IntervalChoice;

export type CorrectAnswer =
  | {
      readonly kind: "note";
      readonly note: Note;
      readonly acceptedSpellings: readonly string[];
    }
  | {
      readonly kind: "numericalDistance";
      readonly value: number;
      readonly unit: DistanceUnit;
    }
  | {
      readonly kind: "namedInterval";
      readonly interval: NamedInterval;
    };

export interface NavigationQuestion {
  readonly id: string;
  readonly form: QuestionForm;
  readonly direction: Direction;
  readonly start: Note;
  readonly end?: Note;
  readonly instruction:
    | {
        readonly kind: "numerical";
        readonly value: number;
        readonly unit: DistanceUnit;
      }
    | {
        readonly kind: "namedInterval";
        readonly interval: NamedInterval;
        readonly numericalReminder?: string;
        readonly requireSpecificTritoneSpelling: boolean;
      }
    | {
        readonly kind: "identifyNumerical";
        readonly unit: DistanceUnit;
      }
    | {
        readonly kind: "identifyNamedInterval";
        readonly numericalReminders: boolean;
        readonly requireSpecificTritoneSpelling: boolean;
      };
  readonly requestedAnswer: CorrectAnswer["kind"];
  readonly answer: CorrectAnswer;
  readonly keyboardMode: "singleRegister" | "fullRange";
  readonly choices:
    | {
        readonly mode: "curated";
        readonly options: readonly AnswerChoice[];
      }
    | {
        readonly mode: "full";
      };
  readonly controls: DifficultyControls;
  readonly demands: readonly SkillDemand[];
}

export type SubmittedAnswer =
  | { readonly kind: "note"; readonly value: Note | string }
  | { readonly kind: "numericalDistance"; readonly value: number }
  | { readonly kind: "namedInterval"; readonly value: IntervalId };

export interface SkillProficiencyChange {
  readonly skill: Skill;
  readonly before: number;
  readonly after: number;
}

export interface AnswerResult {
  readonly correct: boolean;
  readonly correctAnswer: CorrectAnswer;
  readonly proficiencyChanges: readonly SkillProficiencyChange[];
}

export type RunStatus = SharedRunStatus;

export type RunState = SharedRunState<Skill>;

export interface AnswerTransition {
  readonly state: RunState;
  readonly result: AnswerResult;
}

export type Rng = () => number;
