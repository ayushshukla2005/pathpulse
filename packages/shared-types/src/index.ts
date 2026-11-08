export type UserRole = "USER" | "CONTRIBUTOR" | "MODERATOR" | "ORGANIZATION_ADMIN" | "SUPER_ADMIN";

export type MobilityProfile =
  | "WHEELCHAIR"
  | "LIMITED_MOBILITY"
  | "VISUALLY_IMPAIRED"
  | "HEARING_IMPAIRED"
  | "STROLLER"
  | "CUSTOM"
  | "POWERED_WHEELCHAIR"
  | "MOTORIZED"
  | "CANE_OR_CRUTCHES"
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

export interface OrganizationMembershipSummary {
  organizationId: string;
  role: UserRole;
  organizationName?: string;
  organizationSlug?: string;
}

export interface CurrentUserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date | string;
  preferences: UserPreferences | null;
  organizationMemberships?: OrganizationMembershipSummary[];
  organizationId?: string | null;
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

export type OperationalStatus = "OPERATIONAL" | "DEGRADED" | "OUT_OF_SERVICE" | "UNKNOWN";

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

export type ConnectionType = "CORRIDOR" | "RAMP" | "STAIRS" | "ELEVATOR" | "DOOR";

export type Confidence = "CONFIRMED" | "UNVERIFIED" | "UNAVAILABLE";

export type RouteAccessibility = "STEP_FREE" | "MIXED" | "UNVERIFIED";

export interface RouteSegment {
  fromNodeId: string;
  toNodeId: string;
  edgeId: string;
  connectionType: ConnectionType;
  distanceMeters: number;
  confidence: Confidence;
  instruction: string;
}

export interface FindRouteRequest {
  buildingId: string;
  originNodeId: string;
  destinationNodeId: string;
  profile: MobilityProfile;
}

export interface RouteSuccessResponse {
  status: "FOUND";
  steps: RouteSegment[];
  totalDistanceMeters: number;
  accessibility: RouteAccessibility;
  warnings: string[];
  cache?: "HIT" | "MISS";
}

export interface RouteFailureResponse {
  status: "NO_CONFIRMED_ROUTE" | "UNREACHABLE" | "INVALID_INPUT" | "NOT_FOUND" | "BAD_REQUEST";
  reason: string;
}

export type RoutePlanResult = RouteSuccessResponse | RouteFailureResponse;

export interface MapNodeSummary {
  id: string;
  building_id: string;
  floor_id: string;
  node_type: string;
  name: string | null;
  x_coordinate: number;
  y_coordinate: number;
  latitude: number | null;
  longitude: number | null;
  is_accessible: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MapEdgeSummary {
  id: string;
  building_id: string;
  from_node_id: string;
  to_node_id: string;
  connection_type: ConnectionType;
  distance_meters: number;
  step_free: boolean;
  width_cm: number | null;
  slope_percent: number | null;
  surface: string | null;
  operational_status: OperationalStatus;
  verification_level: VerificationLevel;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface BuildingNavigationGraph {
  building: BuildingSummary;
  floors: FloorSummary[];
  nodes: MapNodeSummary[];
  edges: MapEdgeSummary[];
}

export interface FloorDetail {
  floor: FloorSummary;
  building: BuildingSummary;
  nodes: MapNodeSummary[];
  facilities: FacilityItem[];
}

export interface FloorStepGroup {
  floorId: string;
  floorNumber: number;
  floorName: string;
  steps: RouteSegment[];
}

export type ReportCategory = "BROKEN_LIFT" | "BLOCKED_RAMP" | "INACCESSIBLE_ENTRANCE" | "OTHER";

export type ReportStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "RESOLUTION_SUBMITTED"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED";

export type EvidenceStatus = "PENDING_UPLOAD" | "RECEIVED" | "REJECTED";

export interface EvidenceItem {
  id: string;
  report_id: string;
  content_type: string;
  size_bytes: number;
  status: EvidenceStatus;
  created_at: Date | string;
  updated_at: Date | string;
  presigned_url?: string;
}

export interface IssueReportItem {
  id: string;
  tracking_code: string;
  user_id: string;
  venue_id: string | null;
  facility_id: string | null;
  category: ReportCategory;
  title: string | null;
  description: string;
  status: ReportStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  evidence?: EvidenceItem[];
  venue?: { id: string; name: string } | null;
  facility?: { id: string; name: string } | null;
}

export interface CreateReportRequest {
  category: ReportCategory;
  description: string;
  venueId?: string;
  facilityId?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateEvidenceRequest {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
}

export interface CreateEvidenceResponse {
  evidenceId: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface CompleteEvidenceResponse {
  evidenceId: string;
  status: EvidenceStatus;
  verified: boolean;
}

export interface PaginatedReportsResponse {
  data: IssueReportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type WorkflowAction =
  | "REVIEW"
  | "VERIFY"
  | "REJECT"
  | "ASSIGN"
  | "SUBMIT_RESOLUTION"
  | "CONFIRM_RESOLUTION"
  | "REOPEN"
  | "CLOSE_REJECTED";

export interface AllowedActionItem {
  action: WorkflowAction;
  label: string;
  targetStatus: ReportStatus;
  requiresReason?: boolean;
}

export interface ReportWorkflowSummary {
  id: string;
  trackingCode: string;
  status: ReportStatus;
  category: ReportCategory;
  reopenCount: number;
  assignedToUserId: string | null;
  verifiedByUserId: string | null;
  resolvedAt: string | null;
  allowedActions: AllowedActionItem[];
}

export interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  createdAt: string;
}

export interface DuplicateSuggestion {
  candidateId: string;
  trackingCode: string;
  title: string | null;
  similarity: number;
  status: ReportStatus;
  createdAt: string;
}

export interface UserNotificationItem {
  id: string;
  reportId: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: UserNotificationItem[];
  unreadCount: number;
}

export interface OrganizationDashboardMetrics {
  verifiedRouteCoverage: number;
  pendingIssues: number;
  verifiedFacilities: number;
  resolvedReports: number;
  generatedAt: string;
}

export interface OrganizationBuildingItem {
  id: string;
  name: string;
  buildingCode: string | null;
  graphVersion: number;
  venueId: string;
  venueName: string;
  floorCount: number;
  facilityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationBuildingsResponse {
  items: OrganizationBuildingItem[];
  total: number;
}

export interface OrganizationFacilityItem {
  id: string;
  venueId: string;
  venueName?: string;
  buildingId: string | null;
  buildingName?: string | null;
  floorId: string | null;
  floorName?: string | null;
  nodeId: string | null;
  facilityType: FacilityType;
  name: string;
  operationalStatus: OperationalStatus;
  verificationLevel: VerificationLevel;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationFacilitiesResponse {
  items: OrganizationFacilityItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationMaintenanceTaskItem {
  id: string;
  reportId: string;
  reportTrackingCode?: string;
  reportTitle?: string | null;
  reportCategory?: ReportCategory;
  organizationId: string;
  assignedToId: string | null;
  assignedToName: string | null;
  status: string;
  priority: string;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMaintenanceTasksResponse {
  items: OrganizationMaintenanceTaskItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FacilityStatusBroadcast {
  facilityId: string;
  facilityType: string;
  name: string;
  buildingId: string;
  status: OperationalStatus;
  verificationLevel: VerificationLevel;
  lastVerifiedAt: string | null;
  graphVersion: number;
}

export interface UpdateFacilityStatusRequest {
  status: OperationalStatus;
  verificationLevel?: VerificationLevel;
}
