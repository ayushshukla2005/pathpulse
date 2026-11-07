import { MobilityProfile } from "./profiles";

export type NodeKind =
  | "ENTRANCE"
  | "RAMP_START"
  | "RAMP_END"
  | "STAIRS"
  | "ELEVATOR"
  | "LOBBY"
  | "CORRIDOR"
  | "RESTROOM"
  | "DOOR"
  | "ROOM"
  | "OTHER";

export type ConnectionType = "CORRIDOR" | "RAMP" | "STAIRS" | "ELEVATOR" | "DOOR";

export type Confidence = "CONFIRMED" | "UNVERIFIED" | "UNAVAILABLE";

export type OperationalStatus = "OPERATIONAL" | "OUT_OF_SERVICE" | "UNKNOWN";

export interface GraphNode {
  id: string;
  buildingId: string;
  floorId: string;
  floorNumber: number;
  kind: NodeKind;
  latitude: number | null;
  longitude: number | null;
  label: string;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  connectionType: ConnectionType;
  stepFree: boolean;
  widthCm?: number;
  slopePercent?: number;
  surface?: string;
  operationalStatus: OperationalStatus;
  confidence?: Confidence;
  lastVerifiedAt?: Date | string;
  isBidirectional: boolean;
}

export interface NavigationGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

export interface RouteSegment {
  fromNodeId: string;
  toNodeId: string;
  edgeId: string;
  connectionType: ConnectionType;
  distanceMeters: number;
  confidence: Confidence;
  instruction: string;
}

export type RouteResult =
  | {
      status: "FOUND";
      steps: RouteSegment[];
      totalDistanceMeters: number;
      accessibility: "STEP_FREE" | "MIXED" | "UNVERIFIED";
      warnings: string[];
    }
  | {
      status: "NO_CONFIRMED_ROUTE";
      reason: string;
    }
  | {
      status: "UNREACHABLE";
      reason: string;
    }
  | {
      status: "INVALID_INPUT";
      reason: string;
    };

export { MobilityProfile };
