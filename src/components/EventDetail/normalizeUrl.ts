const SAFE_SCHEMES = new Set(["https:", "http:"]);

export function normalizeUrl(raw: string): string | null {
  if (!raw) return null;
  let candidate = raw;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    candidate = "https://" + raw;
  }
  try {
    const url = new URL(candidate);
    if (!SAFE_SCHEMES.has(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}
