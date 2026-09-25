import type {
  RunProfile,
  RunState as SharedRunState,
  SkillAssessment as SharedSkillAssessment,
} from "../run/director";
import type { Pitch } from "../music";

export const IMITATION_SKILLS = [
  "pitchDirection",
  "intervalSize",
  "pitchNavigation",
  "relationshipTransposition",
] as const;

export type ImitationSkill = (typeof IMITATION_SKILLS)[number];
export type SkillAssessment = SharedSkillAssessment;
export type ImitationProfile = RunProfile<ImitationSkill>;
export interface ImitationRunState extends SharedRunState<ImitationSkill> {
  readonly lastControls?: ImitationControls;
  readonly controlStagingCursor?: number;
}
export type Rng = () => number;

export type ContourSetting =
  | "oneDirectionNoRepeats"
  | "oneDirectionWithRepeats"
  | "oneTurnNoRepeats"
  | "oneTurnWithRepeats"
  | "multipleTurns";
export type IntervalPrecisionSetting =
  "direction" | "tolerance3" | "tolerance2" | "tolerance1" | "exact";
export type PitchSelectionSetting = "curated" | "expanded" | "fullKeyboard";
export type AnchorPositionSetting = "first" | "last" | "middle";
export type TranspositionSetting =
  "none" | "octave" | "separatedNonOctave" | "overlappingNonOctave";
export type ReferencePlaysSetting = "unlimited" | "three" | "two" | "one";
export type PitchAuditionsSetting =
  "unlimited" | "threePerEditable" | "onePerEditable" | "none";
export type MovementRangeSetting = "small" | "medium" | "wide";

export interface ImitationControls {
  readonly contourStructure: number;
  readonly phraseLength: number;
  readonly intervalPrecision: number;
  readonly pitchSelectionDemand: number;
  readonly anchorPosition: number;
  readonly transposition: number;
  readonly referencePlays: number;
  readonly pitchAuditions: number;
  readonly referenceMovementRange: number;
}

export interface ActualImitationSettings {
  readonly contourStructure: ContourSetting;
  readonly phraseLength: 3 | 4 | 5 | 6;
  readonly intervalPrecision: IntervalPrecisionSetting;
  readonly pitchSelectionDemand: PitchSelectionSetting;
  readonly anchorPosition: AnchorPositionSetting;
  readonly transposition: TranspositionSetting;
  readonly referencePlays: ReferencePlaysSetting;
  readonly pitchAuditions: PitchAuditionsSetting;
  readonly referenceMovementRange: MovementRangeSetting;
}

export type RelationshipContract =
  | { readonly kind: "direction" }
  | { readonly kind: "tolerance"; readonly tolerance: 1 | 2 | 3 }
  | { readonly kind: "exact" };

export interface ListeningBudgets {
  /** Null means unlimited. The initial complete reference play counts. */
  readonly referencePlays: number | null;
  /** Null means unlimited. The free initial anchor cue does not count. */
  readonly pitchAuditions: number | null;
}

export interface GeneratedFeatures {
  readonly signedMovements: readonly number[];
  readonly tolerance: number | null;
  readonly enabledPitches: readonly Pitch[];
  readonly anchorIndex: number;
  readonly anchorPitch: Pitch;
  readonly anchorShift: number;
  readonly turnCount: number;
  readonly repetitionCount: number;
  readonly maximumMovement: number;
}

export interface ImitationPuzzle {
  readonly id: string;
  readonly requestedControls: ImitationControls;
  readonly settings: ActualImitationSettings;
  readonly referencePitches: readonly Pitch[];
  readonly anchorIndex: number;
  readonly anchorPitch: Pitch;
  readonly enabledPitches: readonly Pitch[];
  readonly contract: RelationshipContract;
  readonly budgets: ListeningBudgets;
  readonly exactReconstruction: readonly Pitch[];
  readonly features: GeneratedFeatures;
  readonly targetedSkills: Readonly<Partial<Record<ImitationSkill, number>>>;
}

export interface MovementCheck {
  readonly movementIndex: number;
  readonly sourceIndex: number;
  readonly destinationIndex: number;
  readonly expected: number;
  readonly entered: number;
  readonly directionMatches: boolean;
  readonly exact: boolean;
  readonly sizeDifference: number;
  readonly nearToleranceBoundary: boolean;
  readonly accepted: boolean;
}

export type SubmissionIssue =
  "wrongLength" | "invalidPitch" | "anchorChanged" | "pitchOutsideSupply";

export interface SubmissionCheck {
  readonly accepted: boolean;
  readonly exact: boolean;
  readonly anchorValid: boolean;
  readonly supplyValid: boolean;
  readonly issues: readonly SubmissionIssue[];
  readonly movements: readonly MovementCheck[];
}

export type MovementFeedbackStatus =
  "exact" | "variation" | "nearBoundary" | "error";

export interface MovementFeedback {
  readonly kind: "movement";
  readonly movementIndex: number;
  readonly attachedSlot: number;
  readonly expectedMovement: number;
  readonly enteredMovement: number;
  readonly expectedDirection: "higher" | "lower" | "repeated";
  readonly status: MovementFeedbackStatus;
}

export interface TargetFeedback {
  readonly kind: "targetComparison";
  readonly slotIndex: number;
  readonly exactTarget: Pitch;
  readonly enteredPitch: Pitch;
  readonly signedOffset: number;
}

export interface SlotFeedback {
  readonly slotIndex: number;
  readonly suppliedAnchor: boolean;
  readonly movements: readonly MovementFeedback[];
  readonly targetComparison: TargetFeedback | null;
}

export interface SubmissionFeedback {
  readonly accepted: boolean;
  readonly exact: boolean;
  readonly issues: readonly SubmissionIssue[];
  readonly slots: readonly SlotFeedback[];
}
