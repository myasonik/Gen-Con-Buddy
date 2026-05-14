export function parseCSV(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}
