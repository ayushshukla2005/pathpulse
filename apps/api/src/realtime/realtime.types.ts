import { OperationalStatus, VerificationLevel } from "@prisma/client";

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

export interface SubscribeBuildingDto {
  buildingId: string;
}

export interface SocketUserData {
  id: string;
  role: string;
}
