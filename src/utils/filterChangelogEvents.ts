import type { Event, SearchFormValues } from "./types";
import { DAY_DATES } from "./searchParams";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Indiana/Indianapolis",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DAY_DATE_OBJECTS: Record<string, { start: Date; end: Date }> = Object.fromEntries(
  Object.entries(DAY_DATES).map(([key, { start, end }]) => [
    key,
    { start: new Date(start), end: new Date(end) },
  ]),
);

function extractTimeET(dateStr: string): string {
  const parts = timeFormatter.formatToParts(new Date(dateStr));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour === "24" ? "00" : hour}:${minute}`;
}

export function filterChangelogEvents(events: Event[], filter: SearchFormValues): Event[] {
  const eventTypes = filter.eventType ? filter.eventType.split(",").filter(Boolean) : [];
  const dayList = filter.days ? filter.days.split(",").filter((d) => d in DAY_DATES) : [];
  const hasTimeFilter = Boolean(filter.timeStart || filter.timeEnd);

  if (eventTypes.length === 0 && dayList.length === 0 && !hasTimeFilter) {
    return events;
  }

  return events.filter((event) => {
    const [eventTypeCode] = event.attributes.eventType.split(" - ");
    if (eventTypes.length > 0 && !eventTypes.includes(eventTypeCode ?? "")) {
      return false;
    }

    if (dayList.length > 0) {
      const startDate = new Date(event.attributes.startDateTime);
      const matchesDay = dayList.some((day) => {
        const { start: dayStart, end: dayEnd } = DAY_DATE_OBJECTS[day];
        return startDate >= dayStart && startDate < dayEnd;
      });
      if (!matchesDay) {
        return false;
      }
    }

    if (hasTimeFilter) {
      const eventTime = extractTimeET(event.attributes.startDateTime);
      if (filter.timeStart && eventTime < filter.timeStart) {
        return false;
      }
      if (filter.timeEnd && eventTime > filter.timeEnd) {
        return false;
      }
    }

    return true;
  });
}
