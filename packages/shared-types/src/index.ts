export type UserRole = "USER" | "CONTRIBUTOR" | "MODERATOR" | "ORGANIZATION_ADMIN" | "SUPER_ADMIN";

export type MobilityProfile =
  | "WHEELCHAIR"
  | "POWERED_WHEELCHAIR"
  | "MOTORIZED"
  | "CANE_OR_CRUTCHES"
  | "STROLLER"
  | "VISUAL_IMPAIRMENT"
  | "ELDERLY"
  | "DEFAULT";

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserSummary;
  tokens: TokenPair;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  mobility_profile: MobilityProfile;
  avoid_stairs: boolean;
  prefer_voice_guidance: boolean;
  high_contrast: boolean;
  text_scale: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UpdatePreferencesRequest {
  mobilityProfile?: MobilityProfile;
  avoidStairs?: boolean;
  preferVoiceGuidance?: boolean;
  highContrast?: boolean;
  textScale?: number;
}

export interface CurrentUserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | string;
  preferences: UserPreferences | null;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId: string;
}
