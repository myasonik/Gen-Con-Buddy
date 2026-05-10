export type OpenMap = Map<number, Map<string, undefined>>;

export function parseOpenParam(values: string[]): OpenMap {
  const result: OpenMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    const segCount = parts.length;
    // Accept 1-segment (position), 2-segment (position.group),
    // and legacy 4-segment (position.group.field.dir) — sort portion silently ignored.
    // Drop 3-segment and 5+-segment values.
    if (segCount !== 1 && segCount !== 2 && segCount !== 4) {
      // skip invalid segment counts
    } else {
      const position = parseInt(parts[0], 10);
      if (!isNaN(position) && position > 0) {
        if (segCount === 1) {
          if (!result.has(position)) {
            result.set(position, new Map());
          }
        } else {
          const [, group, field, dir] = parts;
          if (group) {
            // For legacy 4-segment, validate sort portion before accepting group.
            let valid = true;
            if (segCount === 4) {
              if (!field || (dir !== "asc" && dir !== "desc")) {
                valid = false;
              }
            }

            if (valid) {
              let groupMap = result.get(position);
              if (!groupMap) {
                groupMap = new Map();
                result.set(position, groupMap);
              }
              groupMap.set(group, undefined);
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
    if (!groupMap) {
      // skip missing group maps
    } else if (groupMap.size === 0) {
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
