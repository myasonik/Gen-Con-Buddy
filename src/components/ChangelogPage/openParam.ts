export type OpenMap = Map<number, Set<string>>;

export function parseOpenParam(values: string[]): OpenMap {
  const result: OpenMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    const position = parseInt(parts[0], 10);
    if (!isNaN(position) && position > 0) {
      result.set(position, new Set(parts.slice(1)));
    }
  }
  return result;
}

export function serializeOpenParam(map: OpenMap): string[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([position, groups]) => {
      const groupList = Array.from(groups).sort();
      return groupList.length > 0 ? `${position}.${groupList.join(".")}` : String(position);
    });
}
