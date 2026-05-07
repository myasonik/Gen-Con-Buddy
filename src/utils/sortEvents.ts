import type { Event, EventAttributes } from "./types";

export function sortEvents(events: Event[], field: string, dir: "asc" | "desc"): Event[] {
  return [...events].sort((a, b) => {
    const av = a.attributes[field as keyof EventAttributes];
    const bv = b.attributes[field as keyof EventAttributes];
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else if (av !== undefined && bv !== undefined) {
      cmp = String(av).localeCompare(String(bv));
    }
    return dir === "desc" ? -cmp : cmp;
  });
}
