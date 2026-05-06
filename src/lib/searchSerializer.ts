function coerce(v: string): string | number | boolean {
  if (v === "true") {
    return true;
  }
  if (v === "false") {
    return false;
  }
  const n = Number(v);
  if (v !== "" && !isNaN(n)) {
    return n;
  }
  return v;
}

export function parseSearch(searchStr: string): Record<string, unknown> {
  const str = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  const params = new URLSearchParams(str);
  const result: Record<string, unknown> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? coerce(values[0]) : values.map(coerce);
  }
  return result;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value
          .filter((v) => v !== undefined && v !== null)
          .forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}
