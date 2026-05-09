import type { Event, SearchFormValues } from "./types";
import { DAY_DATES } from "./searchParams";

function extractTimeET(dateStr: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(dateStr));
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
    if (eventTypes.length > 0 && !eventTypes.includes(event.attributes.eventType)) {
      return false;
    }

    if (dayList.length > 0) {
      const startDate = new Date(event.attributes.startDateTime);
      const matchesDay = dayList.some((day) => {
        const dayStart = new Date(DAY_DATES[day].start);
        const dayEnd = new Date(DAY_DATES[day].end);
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
