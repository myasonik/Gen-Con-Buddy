import type { SortState } from "./types";

export function addSort(
  sorts: SortState[],
  field: string,
  dir: "asc" | "desc" = "asc",
): SortState[] {
  if (sorts.some((s) => s.field === field)) {
    return sorts;
  }
  return [...sorts, { field, dir }];
}

export function removeSort(sorts: SortState[], field: string): SortState[] {
  return sorts.filter((s) => s.field !== field);
}

export function setSortDir(sorts: SortState[], field: string, dir: "asc" | "desc"): SortState[] {
  return sorts.map((s) => (s.field === field ? { ...s, dir } : s));
}

export function reorderSort(sorts: SortState[], fromIndex: number, toIndex: number): SortState[] {
  const next = [...sorts];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
