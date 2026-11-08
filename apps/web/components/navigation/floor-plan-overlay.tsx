import type { MapNodeSummary, RouteSegment } from "@pathpulse/shared-types";

interface FloorPlanOverlayProps {
  nodes: MapNodeSummary[];
  routeSegments: RouteSegment[];
  activeFloorId?: string;
  floorName?: string;
  className?: string;
}

export function FloorPlanOverlay({
  nodes,
  routeSegments,
  activeFloorId,
  floorName,
  className = "",
}: FloorPlanOverlayProps) {
  const floorNodes =
    activeFloorId && activeFloorId !== "ALL"
      ? nodes.filter((n) => n.floor_id === activeFloorId)
      : nodes;

  if (floorNodes.length === 0) {
    return (
      <div
        aria-hidden="true"
        className={`flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <span>No map coordinates available for this floor</span>
      </div>
    );
  }

  const xs = floorNodes.map((n) => n.x_coordinate);
  const ys = floorNodes.map((n) => n.y_coordinate);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(maxX - minX, 10);
  const spanY = Math.max(maxY - minY, 10);

  const padding = 20;
  const width = 600;
  const height = 360;

  const scaleX = (x: number) => padding + ((x - minX) / spanX) * (width - 2 * padding);
  const scaleY = (y: number) => padding + ((y - minY) / spanY) * (height - 2 * padding);

  const nodePosMap = new Map<string, { x: number; y: number; label: string }>();
  for (const n of floorNodes) {
    nodePosMap.set(n.id, {
      x: scaleX(n.x_coordinate),
      y: scaleY(n.y_coordinate),
      label: n.name || n.node_type,
    });
  }

  const floorSegments = routeSegments.filter((seg) => {
    return nodePosMap.has(seg.fromNodeId) && nodePosMap.has(seg.toNodeId);
  });

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Floor Visual Overlay {floorName ? `• ${floorName}` : ""}
        </span>
        <span className="text-[11px] text-slate-500">
          {floorSegments.length} route segments visible
        </span>
      </div>

      <div className="p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-h-[400px] select-none">
          <defs>
            <marker
              id="route-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
            </marker>
          </defs>

          {floorSegments.map((seg, idx) => {
            const p1 = nodePosMap.get(seg.fromNodeId);
            const p2 = nodePosMap.get(seg.toNodeId);
            if (!p1 || !p2) return null;

            return (
              <g key={`seg-${seg.edgeId}-${idx}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeLinecap="round"
                  markerEnd="url(#route-arrow)"
                />
              </g>
            );
          })}

          {floorNodes.map((n) => {
            const pos = nodePosMap.get(n.id);
            if (!pos) return null;
            const isRouteNode = routeSegments.some(
              (s) => s.fromNodeId === n.id || s.toNodeId === n.id,
            );

            return (
              <g key={`node-${n.id}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isRouteNode ? 6 : 4}
                  fill={isRouteNode ? "#4338ca" : "#94a3b8"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#475569"
                  className="font-medium"
                >
                  {pos.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
