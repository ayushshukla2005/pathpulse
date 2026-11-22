import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatSourceText(source?: string | null, updatedAt?: Date | string | null): string {
  const dateStr = updatedAt ? new Date(updatedAt).toISOString().split("T")[0] : "";
  if (source === "OSM") {
    return dateStr ? `Source: OpenStreetMap, imported ${dateStr}` : "Source: OpenStreetMap";
  }
  if (source === "OPERATOR") {
    return "Source: facility operator";
  }
  if (source === "COMMUNITY") {
    return "Source: community report";
  }
  return "Source: verified baseline";
}
