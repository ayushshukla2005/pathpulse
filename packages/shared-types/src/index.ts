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

export type VerificationLevel = "CONFIRMED" | "UNVERIFIED" | "UNAVAILABLE";

export type OperationalStatus = "OPERATIONAL" | "DEGRADED" | "OUT_OF_SERVICE";

export type FacilityType =
  | "ELEVATOR"
  | "LIFT"
  | "RAMP"
  | "ACCESSIBLE_RESTROOM"
  | "WASHROOM"
  | "ENTRANCE"
  | "RECEPTION"
  | "TACTILE_PAVING"
  | "PARKING_BAY"
  | "HELP_DESK"
  | "OTHER";

export interface FacilityItem {
  id: string;
  venue_id: string;
  building_id: string | null;
  floor_id: string | null;
  node_id: string | null;
  facility_type: FacilityType;
  name: string;
  operational_status: OperationalStatus;
  verification_level: VerificationLevel;
  last_verified_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface BuildingSummary {
  id: string;
  venue_id: string;
  name: string;
  building_code: string | null;
  graph_version: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface FloorSummary {
  id: string;
  building_id: string;
  floor_number: number;
  name: string;
  level_index: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface VenueListItem {
  id: string;
  organization_id: string | null;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  facilities?: FacilityItem[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface VenueDetail extends VenueListItem {
  buildings: BuildingSummary[];
  facilities: FacilityItem[];
}

export interface FindVenuesParams {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  category?: string;
  limit?: number;
}

export interface VerificationSummaryCounts {
  confirmed: number;
  unverified: number;
  unavailable: number;
  total: number;
  hasStepFreeEntrance: boolean;
}
