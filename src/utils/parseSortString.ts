import type { SortState } from "./types";

export function parseSortString(s: string): SortState | null {
  const [field, dir] = s.split(".");
  if (field && (dir === "asc" || dir === "desc")) {
    return { field, dir };
  }
  return null;
}
