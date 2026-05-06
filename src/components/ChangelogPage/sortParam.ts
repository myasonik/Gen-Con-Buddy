export interface SortState {
  field: string;
  dir: "asc" | "desc";
}
export type SortMap = Map<number, Map<string, SortState>>;

export function parseSortParam(values: string[]): SortMap {
  const result: SortMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    if (parts.length >= 4) {
      const [posStr, group, field, dir] = parts;
      const position = parseInt(posStr, 10);
      if (!isNaN(position) && position > 0 && (dir === "asc" || dir === "desc")) {
        let groupMap = result.get(position);
        if (!groupMap) {
          groupMap = new Map();
          result.set(position, groupMap);
        }
        groupMap.set(group, { field, dir });
      }
    }
  }
  return result;
}

export function serializeSortParam(map: SortMap): string[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .flatMap(([position, groups]) =>
      Array.from(groups.entries()).map(
        ([group, { field, dir }]) => `${position}.${group}.${field}.${dir}`,
      ),
    );
}
