export interface SortState {
  field: string;
  dir: "asc" | "desc";
}

export type OpenMap = Map<number, Map<string, SortState | undefined>>;

export function parseOpenParam(values: string[]): OpenMap {
  const result: OpenMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    if (parts.length === 1 || parts.length === 2 || parts.length === 4) {
      const position = parseInt(parts[0], 10);
      if (!isNaN(position) && position > 0) {
        if (parts.length === 1) {
          if (!result.has(position)) {
            result.set(position, new Map());
          }
        } else {
          const [, group, field, dir] = parts;
          if (group) {
            let sortState: SortState | undefined = undefined;
            let valid = true;
            if (parts.length === 4) {
              if (field && (dir === "asc" || dir === "desc")) {
                sortState = { field, dir };
              } else {
                valid = false;
              }
            }
            if (valid) {
              let groupMap = result.get(position);
              if (!groupMap) {
                groupMap = new Map();
                result.set(position, groupMap);
              }
              groupMap.set(group, sortState);
            }
          }
        }
      }
    }
  }
  return result;
}

export function serializeOpenParam(map: OpenMap): string[] {
  const result: string[] = [];
  const positions = [...map.keys()].sort((a, b) => a - b);
  for (const pos of positions) {
    const groupMap = map.get(pos);
    if (groupMap) {
      if (groupMap.size === 0) {
        result.push(String(pos));
      } else {
        const groups = [...groupMap.keys()].sort();
        for (const group of groups) {
          const sort = groupMap.get(group);
          if (sort !== undefined) {
            result.push(`${pos}.${group}.${sort.field}.${sort.dir}`);
          } else {
            result.push(`${pos}.${group}`);
          }
        }
      }
    }
  }
  return result;
}
