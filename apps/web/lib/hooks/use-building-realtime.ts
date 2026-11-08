"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/client";
import { FacilityStatusBroadcast, OrganizationFacilitiesResponse } from "@pathpulse/shared-types";

export type RealtimeConnectionStatus = "connected" | "reconnecting" | "unavailable";

export interface UseBuildingRealtimeOptions {
  buildingId: string;
  onRefresh?: () => void;
}

export interface UseBuildingRealtimeReturn {
  status: RealtimeConnectionStatus;
  statusText: string;
  announcement: string;
  manualRefresh: () => void;
}

export function useBuildingRealtime(
  options: UseBuildingRealtimeOptions,
): UseBuildingRealtimeReturn {
  const { buildingId, onRefresh } = options;
  const queryClient = useQueryClient();

  const [status, setStatus] = React.useState<RealtimeConnectionStatus>("reconnecting");
  const [announcement, setAnnouncement] = React.useState<string>("");

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingCountRef = React.useRef<number>(0);
  const socketRef = React.useRef<Socket | null>(null);

  const manualRefresh = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["organization-facilities"],
    });
    if (onRefresh) {
      onRefresh();
    }
  }, [queryClient, onRefresh]);

  React.useEffect(() => {
    if (!buildingId) {
      setStatus("unavailable");
      return;
    }

    const token = getAccessToken();
    const apiUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:4000";

    const socket = io(`${apiUrl}/realtime`, {
      transports: ["websocket"],
      auth: {
        token: token || "",
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("subscribe:building", { buildingId });
    });

    socket.on("reconnect_attempt", () => {
      setStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      setStatus("unavailable");
    });

    socket.on("connect_error", () => {
      setStatus("unavailable");
    });

    socket.on("error", () => {
      setStatus("unavailable");
    });

    socket.on("facility.status.changed", (payload: FacilityStatusBroadcast) => {
      if (payload.buildingId !== buildingId) {
        return;
      }

      queryClient.setQueriesData(
        { queryKey: ["organization-facilities"] },
        (oldData: OrganizationFacilitiesResponse | undefined) => {
          if (!oldData || !Array.isArray(oldData.items)) {
            return oldData;
          }
          const nextItems = oldData.items.map((item) =>
            item.id === payload.facilityId
              ? {
                  ...item,
                  operationalStatus: payload.status,
                  verificationLevel: payload.verificationLevel,
                  lastVerifiedAt: payload.lastVerifiedAt,
                }
              : item,
          );
          return {
            ...oldData,
            items: nextItems,
          };
        },
      );

      pendingCountRef.current += 1;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const count = pendingCountRef.current;
        pendingCountRef.current = 0;
        if (count > 0) {
          const text = count === 1 ? "1 facility updated" : `${count} facilities updated`;
          setAnnouncement(text);
        }
      }, 3000);
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      socket.emit("unsubscribe:building", { buildingId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [buildingId, queryClient]);

  const statusText =
    status === "connected"
      ? "Live updates connected"
      : status === "reconnecting"
        ? "Reconnecting"
        : "Live updates unavailable";

  return {
    status,
    statusText,
    announcement,
    manualRefresh,
  };
}
