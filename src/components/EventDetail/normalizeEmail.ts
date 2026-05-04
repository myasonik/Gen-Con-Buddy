export function normalizeEmail(raw: string): string | null {
  if (!raw) {
    return null;
  }
  if (/\s/.test(raw)) {
    return null;
  }
  const parts = raw.split("@");
  if (parts.length !== 2) {
    return null;
  }
  const [, domain] = parts;
  if (!domain.includes(".")) {
    return null;
  }
  return `mailto:${raw}`;
}
