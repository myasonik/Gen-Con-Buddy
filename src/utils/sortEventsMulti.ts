import type { Event, EventAttributes, SortState } from "./types";

export function sortEventsMulti(events: Event[], sorts: SortState[]): Event[] {
  if (sorts.length === 0) {
    return events;
  }
  return [...events].sort((a, b) => {
    for (const { field, dir } of sorts) {
      const av = a.attributes[field as keyof EventAttributes];
      const bv = b.attributes[field as keyof EventAttributes];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (av !== undefined && bv !== undefined) {
        cmp = String(av).localeCompare(String(bv));
      }
      if (cmp !== 0) {
        return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}
