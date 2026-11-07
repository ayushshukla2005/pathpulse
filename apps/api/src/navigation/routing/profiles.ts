export type MobilityProfile =
  | "WHEELCHAIR"
  | "LIMITED_MOBILITY"
  | "VISUALLY_IMPAIRED"
  | "HEARING_IMPAIRED"
  | "STROLLER"
  | "CUSTOM";

export interface ProfileRules {
  allowStairs: boolean;
  requireStepFree: boolean;
  allowUnverifiedSegments: boolean;
  maxSegmentDistanceMeters?: number;
}

export const PROFILE_RULES: Record<MobilityProfile, ProfileRules> = {
  WHEELCHAIR: {
    allowStairs: false,
    requireStepFree: true,
    allowUnverifiedSegments: false,
  },
  STROLLER: {
    allowStairs: false,
    requireStepFree: true,
    allowUnverifiedSegments: false,
  },
  LIMITED_MOBILITY: {
    allowStairs: false,
    requireStepFree: true,
    allowUnverifiedSegments: true,
  },
  VISUALLY_IMPAIRED: {
    allowStairs: true,
    requireStepFree: false,
    allowUnverifiedSegments: true,
  },
  HEARING_IMPAIRED: {
    allowStairs: true,
    requireStepFree: false,
    allowUnverifiedSegments: true,
  },
  CUSTOM: {
    allowStairs: true,
    requireStepFree: false,
    allowUnverifiedSegments: true,
  },
};

export function getProfileRules(
  profile: MobilityProfile,
  overrides?: Partial<ProfileRules>,
): ProfileRules {
  const base = PROFILE_RULES[profile] ?? PROFILE_RULES.CUSTOM;
  if (!overrides) {
    return base;
  }
  return {
    ...base,
    ...overrides,
  };
}
