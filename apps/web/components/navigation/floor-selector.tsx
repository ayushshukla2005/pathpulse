interface FloorOption {
  floorId: string;
  floorNumber: number;
  floorName: string;
  stepCount: number;
}

interface FloorSelectorProps {
  floors: FloorOption[];
  selectedFloorId: string;
  onSelectFloor: (floorId: string) => void;
  className?: string;
}

export function FloorSelector({
  floors,
  selectedFloorId,
  onSelectFloor,
  className = "",
}: FloorSelectorProps) {
  if (floors.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Floor filter" className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Floors:
      </span>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Route floors">
        <button
          type="button"
          role="tab"
          aria-selected={selectedFloorId === "ALL"}
          onClick={() => onSelectFloor("ALL")}
          className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
            selectedFloorId === "ALL"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All Floors
        </button>
        {floors.map((floor) => {
          const isSelected = selectedFloorId === floor.floorId;
          return (
            <button
              key={floor.floorId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectFloor(floor.floorId)}
              className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{floor.floorName}</span>
              <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] dark:bg-white/20">
                {floor.stepCount}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
