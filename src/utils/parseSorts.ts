import type { SortState } from "./types";

export function parseSorts(s: string): SortState[] {
  if (!s) {
    return [];
  }
  return s.split(",").reduce<SortState[]>((acc, token) => {
    const dot = token.indexOf(".");
    if (dot === -1) {
      return acc;
    }
    const field = token.slice(0, dot);
    const dir = token.slice(dot + 1);
    if (field && (dir === "asc" || dir === "desc")) {
      acc.push({ field, dir });
    }
    return acc;
  }, []);
}

export function serializeSorts(sorts: SortState[]): string | undefined {
  if (sorts.length === 0) {
    return undefined;
  }
  return sorts.map((s) => `${s.field}.${s.dir}`).join(",");
}
