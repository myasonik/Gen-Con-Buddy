export type OpenMap = Map<number, Map<string, undefined>>;

export function parseOpenParam(values: string[]): OpenMap {
  const result: OpenMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    const segCount = parts.length;
    // Accept 1-segment (position), 2-segment (position.group),
    // and legacy 4-segment (position.group.field.dir) — sort portion silently ignored.
    if (segCount !== 1 && segCount !== 2 && segCount !== 4) continue;

    const position = parseInt(parts[0], 10);
    if (isNaN(position) || position <= 0) continue;

    if (segCount === 1) {
      if (!result.has(position)) {
        result.set(position, new Map());
      }
      continue;
    }

    const group = parts[1];
    if (!group) continue;

    // For legacy 4-segment, validate sort portion before accepting group.
    if (segCount === 4) {
      const dir = parts[3];
      if (!parts[2] || (dir !== "asc" && dir !== "desc")) continue;
    }

    let groupMap = result.get(position);
    if (!groupMap) {
      groupMap = new Map();
      result.set(position, groupMap);
    }
    groupMap.set(group, undefined);
  }
  return result;
}

export function serializeOpenParam(map: OpenMap): string[] {
  const result: string[] = [];
  const positions = [...map.keys()].sort((a, b) => a - b);
  for (const pos of positions) {
    const groupMap = map.get(pos);
    if (!groupMap) continue;
    if (groupMap.size === 0) {
      result.push(String(pos));
    } else {
      const groups = [...groupMap.keys()].sort();
      for (const group of groups) {
        result.push(`${pos}.${group}`);
      }
    }
  }
  return result;
}
