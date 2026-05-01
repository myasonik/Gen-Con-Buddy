import { describe, expect, it } from "vitest";
import { buildGoogleCalendarUrl } from "./googleCalendar";
import { makeEvent } from "../test/msw/factory";

function parseUrl(attrs: ReturnType<typeof makeEvent>["attributes"]): URL {
  return new URL(buildGoogleCalendarUrl(attrs));
}

describe("buildGoogleCalendarUrl", () => {
  it("returns a Google Calendar render URL", () => {
    const url = parseUrl(makeEvent().attributes);
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("sets text to event title", () => {
    const url = parseUrl(makeEvent({ title: "Epic Dragon Hunt" }).attributes);
    expect(url.searchParams.get("text")).toBe("Epic Dragon Hunt");
  });

  it("formats dates as local Indianapolis time without Z suffix", () => {
    const url = parseUrl(
      makeEvent({
        startDateTime: "2024-08-01T10:00:00Z",
        endDateTime: "2024-08-01T14:00:00Z",
      }).attributes,
    );
    expect(url.searchParams.get("dates")).toBe("20240801T060000/20240801T100000");
  });

  it("builds location with table number", () => {
    const url = parseUrl(
      makeEvent({ location: "ICC", roomName: "Hall A", tableNumber: "12" }).attributes,
    );
    expect(url.searchParams.get("location")).toBe("ICC — Hall A, Table 12");
  });

  it("omits table segment when tableNumber is empty", () => {
    const url = parseUrl(
      makeEvent({ location: "ICC", roomName: "Hall A", tableNumber: "" }).attributes,
    );
    expect(url.searchParams.get("location")).toBe("ICC — Hall A");
  });

  it("details block contains long description", () => {
    const url = parseUrl(makeEvent({ longDescription: "A detailed description." }).attributes);
    expect(url.searchParams.get("details")).toContain("A detailed description.");
  });

  it("details block omits long description when empty", () => {
    const url = parseUrl(makeEvent({ longDescription: "" }).attributes);
    const details = url.searchParams.get("details") ?? "";
    expect(details).not.toMatch(/^\n/);
  });

  it("details block includes GM names", () => {
    const url = parseUrl(makeEvent({ gmNames: "Jane Smith" }).attributes);
    expect(url.searchParams.get("details")).toContain("GM(s): Jane Smith");
  });

  it("details block always includes cost, even at zero", () => {
    const url = parseUrl(makeEvent({ cost: 0 }).attributes);
    expect(url.searchParams.get("details")).toContain("Cost: $0.00");
  });

  it("details block includes non-zero cost", () => {
    const url = parseUrl(makeEvent({ cost: 4 }).attributes);
    expect(url.searchParams.get("details")).toContain("Cost: $4.00");
  });

  it("details block includes duration", () => {
    const url = parseUrl(makeEvent({ duration: 4 }).attributes);
    expect(url.searchParams.get("details")).toContain("Duration: 4 hours");
  });

  it("details block omits empty materialsRequired", () => {
    const url = parseUrl(makeEvent({ materialsRequired: "" }).attributes);
    expect(url.searchParams.get("details")).not.toContain("Materials Required:");
  });

  it("details block includes non-empty materialsRequired", () => {
    const url = parseUrl(makeEvent({ materialsRequired: "Pencil and paper" }).attributes);
    expect(url.searchParams.get("details")).toContain("Materials Required: Pencil and paper");
  });

  it("details block omits empty materialsRequiredDetails", () => {
    const url = parseUrl(makeEvent({ materialsRequiredDetails: "" }).attributes);
    expect(url.searchParams.get("details")).not.toContain("Materials Details:");
  });

  it("details block always ends with Gen Con event page URL", () => {
    const url = parseUrl(makeEvent({ gameId: "RPG24000099" }).attributes);
    expect(url.searchParams.get("details")).toContain(
      "Gen Con event page: https://www.gencon.com/events/RPG24000099",
    );
  });
});
