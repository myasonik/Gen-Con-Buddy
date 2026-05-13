import { act, render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { expect, test } from "vitest";
import { makeEvent } from "../../test/msw/factory";
import { EventListMobile } from "./EventListMobile";
import { COLUMN_VISIBILITY_DEFAULTS } from "../../hooks/useColumnVisibility";
import type { Event } from "../../utils/types";
import type { DayFormat, TypeDisplay, TimeZone } from "./types";

async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Partial<Record<string, boolean>>,
  opts: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean; dayFormat?: DayFormat; timeZone?: TimeZone } = {},
): Promise<ReturnType<typeof render>> {
  const { dayFormat, timeZone, ...typeDisplayProps } = opts;
  const rootRoute = createRootRoute({
    component: () => (
      <EventListMobile
        events={events}
        visibility={visibility}
        dayFormat={dayFormat}
        timeZone={timeZone}
        {...typeDisplayProps}
      />
    ),
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  let result: ReturnType<typeof render> | null = null;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return result as unknown as ReturnType<typeof render>;
}

test("renders a list item for each event", async () => {
  await renderList([makeEvent(), makeEvent()]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
});

test("shows the event title", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("each event row links to its detail route", async () => {
  await renderList([makeEvent({ gameId: "RPG24000042", title: "Dragon Hunt" })]);
  const title = screen.getByText("Dragon Hunt");
  expect(title.closest("a")).toHaveAttribute("href", "/event/RPG24000042");
});

test("shows the event type", async () => {
  await renderList([makeEvent({ eventType: "TCG" })]);
  expect(screen.getByText("TCG")).toBeInTheDocument();
});

test("shows day abbreviation derived from startDateTime", async () => {
  // factory: startDateTime "2024-08-01T10:00:00Z" → Aug 1 2024 = Thursday
  await renderList([makeEvent()]);
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
});

test("shows formatted start time from startDateTime", async () => {
  // "2024-08-01T10:00:00Z" → 06:00 in Indianapolis (EDT = UTC-4)
  await renderList([makeEvent()]);
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
});

test("shows formatted end time from endDateTime", async () => {
  // "2024-08-01T14:00:00Z" → 10:00 in Indianapolis
  await renderList([makeEvent()]);
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
});

test("shows ticket count when tickets are available", async () => {
  await renderList([makeEvent({ ticketsAvailable: 5 })]);
  expect(screen.getByText("5 tickets")).toBeInTheDocument();
});

test("shows singular ticket when only one is available", async () => {
  await renderList([makeEvent({ ticketsAvailable: 1 })]);
  expect(screen.getByText("1 ticket")).toBeInTheDocument();
});

test("shows sold out when ticketsAvailable is 0", async () => {
  await renderList([makeEvent({ ticketsAvailable: 0 })]);
  expect(screen.getByText("Sold out")).toBeInTheDocument();
});

test("shows player range when min and max differ", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })]);
  expect(screen.getByText("2–6")).toBeInTheDocument();
});

test("shows single player count when min equals max", async () => {
  await renderList([makeEvent({ minPlayers: 4, maxPlayers: 4 })]);
  expect(screen.getByText("4")).toBeInTheDocument();
});

test("renders an icon for a known event type", async () => {
  const { container } = await renderList([makeEvent({ eventType: "RPG" })]);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("hides title when visibility.title is false", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: false });
  expect(screen.queryByText("Dragon Hunt")).not.toBeInTheDocument();
});

test("shows title when visibility.title is true", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: true });
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("hides event type when visibility.eventType is false", async () => {
  await renderList([makeEvent({ eventType: "TCG" })], { eventType: false });
  expect(screen.queryByText("TCG")).not.toBeInTheDocument();
});

test("hides tickets when visibility.ticketsAvailable is false", async () => {
  await renderList([makeEvent({ ticketsAvailable: 5 })], { ticketsAvailable: false });
  expect(screen.queryByText("5 tickets")).not.toBeInTheDocument();
});

test("hides day but shows start time when only startDateTime is visible", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: true, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
});

test("hides all time info when day, startDateTime, and endDateTime are all false", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: false, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.queryByText(/06:00/)).not.toBeInTheDocument();
});

test("hides player count when both minPlayers and maxPlayers are false", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: false,
  });
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only minPlayers value when maxPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: true,
    maxPlayers: false,
  });
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only maxPlayers value when minPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: true,
  });
  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("uses COLUMN_VISIBILITY_DEFAULTS when no visibility prop is passed", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("shows day and end time with no separator when startDateTime is hidden", async () => {
  await renderList([makeEvent()], {
    day: true,
    startDateTime: false,
    endDateTime: true,
    minPlayers: false,
    maxPlayers: false,
    minimumPlayTime: false,
    duration: false,
  });
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
  expect(screen.queryByText(/–/)).not.toBeInTheDocument();
});

test("shows location as a detail row when visibility.location is true", async () => {
  await renderList([makeEvent({ location: "ICC" })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    location: true,
  });
  expect(screen.getByText("Location")).toBeInTheDocument();
  expect(screen.getByText("ICC")).toBeInTheDocument();
});

test("does not show location detail row when visibility.location is false", async () => {
  await renderList([makeEvent({ location: "ICC" })], { location: false });
  expect(screen.queryByText("Location")).not.toBeInTheDocument();
});

test("shows cost formatted with dollar sign as a detail row", async () => {
  await renderList([makeEvent({ cost: 4 })], { ...COLUMN_VISIBILITY_DEFAULTS, cost: true });
  expect(screen.getByText("Cost")).toBeInTheDocument();
  expect(screen.getByText("$4.00")).toBeInTheDocument();
});

test("shows shortDescription as a detail row when toggled on", async () => {
  await renderList([makeEvent({ shortDescription: "Quick fun" })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    shortDescription: true,
  });
  expect(screen.getByText("Short Description")).toBeInTheDocument();
  expect(screen.getByText("Quick fun")).toBeInTheDocument();
});

test("shows gameId as a detail row when toggled on", async () => {
  await renderList([makeEvent({ gameId: "RPG24000001" })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    gameId: true,
  });
  expect(screen.getByText("Game ID")).toBeInTheDocument();
  expect(screen.getByText("RPG24000001")).toBeInTheDocument();
});

test("does not render a dl element when no extra columns are toggled on", async () => {
  const { container } = await renderList([makeEvent()], {
    gameId: false,
    group: false,
    shortDescription: false,
    longDescription: false,
    gameSystem: false,
    rulesEdition: false,
    specialCategory: false,
    ageRequired: false,
    experienceRequired: false,
    tournament: false,
    roundNumber: false,
    totalRounds: false,
    duration: false,
    minimumPlayTime: false,
    location: false,
    roomName: false,
    tableNumber: false,
    cost: false,
    attendeeRegistration: false,
    materialsProvided: false,
    materialsRequired: false,
    materialsRequiredDetails: false,
    gmNames: false,
    website: false,
    email: false,
    lastModified: false,
  });
  expect(container.querySelector("dl")).toBeNull();
});

test("combines roundNumber and totalRounds into a single 'Round' row when both visible", async () => {
  await renderList([makeEvent({ roundNumber: 2, totalRounds: 4 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    roundNumber: true,
    totalRounds: true,
  });
  expect(screen.getByText("Round")).toBeInTheDocument();
  expect(screen.getByText("2 out of 4")).toBeInTheDocument();
  expect(screen.queryByText("Round Number")).not.toBeInTheDocument();
  expect(screen.queryByText("Total Rounds")).not.toBeInTheDocument();
});

test("shows roundNumber alone when totalRounds is hidden", async () => {
  await renderList([makeEvent({ roundNumber: 2, totalRounds: 4 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    roundNumber: true,
    totalRounds: false,
  });
  expect(screen.queryByText("Round")).not.toBeInTheDocument();
  expect(screen.queryByText("2 out of 4")).not.toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});

test("shows totalRounds alone when roundNumber is hidden", async () => {
  await renderList([makeEvent({ roundNumber: 2, totalRounds: 4 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    roundNumber: false,
    totalRounds: true,
  });
  expect(screen.queryByText("Round")).not.toBeInTheDocument();
  expect(screen.queryByText("2 out of 4")).not.toBeInTheDocument();
  expect(screen.getByText("4")).toBeInTheDocument();
});

test("combines minimumPlayTime and duration into a single 'Duration' row when both visible", async () => {
  await renderList([makeEvent({ minimumPlayTime: 1, duration: 3 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    minimumPlayTime: true,
    duration: true,
  });
  expect(screen.getByText("Duration")).toBeInTheDocument();
  expect(screen.getByText("1h – 3h")).toBeInTheDocument();
  expect(screen.queryByText("Min Time")).not.toBeInTheDocument();
  expect(screen.queryByText("1h")).not.toBeInTheDocument();
  expect(screen.queryByText("3h")).not.toBeInTheDocument();
});

test("shows duration alone when minimumPlayTime is hidden", async () => {
  await renderList([makeEvent({ minimumPlayTime: 1, duration: 3 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    minimumPlayTime: false,
    duration: true,
  });
  expect(screen.queryByText("1h – 3h")).not.toBeInTheDocument();
  expect(screen.getByText("3h")).toBeInTheDocument();
});

test("shows minimumPlayTime alone when duration is hidden", async () => {
  await renderList([makeEvent({ minimumPlayTime: 1, duration: 3 })], {
    ...COLUMN_VISIBILITY_DEFAULTS,
    minimumPlayTime: true,
    duration: false,
  });
  expect(screen.queryByText("1h – 3h")).not.toBeInTheDocument();
  expect(screen.getByText("1h")).toBeInTheDocument();
});

test("renders event type name in the DOM from full API string format", async () => {
  await renderList([makeEvent({ eventType: "RPG - Roleplaying Game" })]);
  expect(screen.getByText("Roleplaying Game")).toBeInTheDocument();
});

test("list carries data-type-display=name when typeDisplay is name", async () => {
  const { container } = await renderList([makeEvent()], undefined, { typeDisplay: "name" });
  expect(container.querySelector('[data-type-display="name"]')).not.toBeNull();
});

test("list carries data-type-display=code when typeDisplay is code", async () => {
  const { container } = await renderList([makeEvent()], undefined, { typeDisplay: "code" });
  expect(container.querySelector('[data-type-display="code"]')).not.toBeNull();
});

test("list carries data-show-icon=false when showTypeIcon is false", async () => {
  const { container } = await renderList([makeEvent()], undefined, { showTypeIcon: false });
  expect(container.querySelector('[data-show-icon="false"]')).not.toBeNull();
});

test("list has no data-type-display attribute when typeDisplay is both", async () => {
  const { container } = await renderList([makeEvent()], undefined, { typeDisplay: "both" });
  expect(container.querySelector('[data-type-display="code"]')).toBeNull();
  expect(container.querySelector('[data-type-display="name"]')).toBeNull();
});

test("list has no data-show-icon attribute when showTypeIcon is true", async () => {
  const { container } = await renderList([makeEvent()], undefined, { showTypeIcon: true });
  expect(container.querySelector('[data-show-icon="false"]')).toBeNull();
});

test("list has no data-show-icon attribute when showTypeIcon is not passed", async () => {
  const { container } = await renderList([makeEvent()], undefined, {});
  expect(container.querySelector('[data-show-icon="false"]')).toBeNull();
});

test("renders an icon when eventType is the full API string format", async () => {
  const { container } = await renderList([makeEvent({ eventType: "RPG - Roleplaying Game" })]);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("shows just the short code in code mode when eventType is the full API string", async () => {
  await renderList([makeEvent({ eventType: "RPG - Roleplaying Game" })], undefined, {
    typeDisplay: "code",
  });
  expect(screen.getByText("RPG")).toBeInTheDocument();
  expect(screen.queryByText("RPG - Roleplaying Game")).not.toBeInTheDocument();
});

test("shows just the name portion in name mode when eventType is the full API string", async () => {
  await renderList([makeEvent({ eventType: "RPG - Roleplaying Game" })], undefined, {
    typeDisplay: "name",
  });
  expect(screen.getByText("Roleplaying Game")).toBeInTheDocument();
  expect(screen.queryByText("RPG - Roleplaying Game")).not.toBeInTheDocument();
});

test("renders event type code when eventType is the full API string format", async () => {
  await renderList([makeEvent({ eventType: "RPG - Roleplaying Game" })]);
  expect(screen.getByText("RPG")).toBeInTheDocument();
});

test("shows day abbreviation in default day mode", async () => {
  // factory startDateTime 2024-08-01T10:00:00Z = Thu in Indianapolis
  await renderList([makeEvent()], undefined, { dayFormat: "day" });
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
});

test("shows compact numeric date M/d in numeric mode", async () => {
  await renderList([makeEvent()], undefined, { dayFormat: "numeric" });
  expect(screen.getByText(/8\/1/)).toBeInTheDocument();
});

test("shows compact long format EEE M/d in long mode", async () => {
  await renderList([makeEvent()], undefined, { dayFormat: "long" });
  expect(screen.getByText(/Thu 8\/1/)).toBeInTheDocument();
});

test('shows start and end times in Indianapolis time when timeZone is "indy"', async () => {
  // factory startDateTime "2024-08-01T10:00:00Z" = 06:00 Indianapolis (UTC-4)
  // factory endDateTime "2024-08-01T14:00:00Z" = 10:00 Indianapolis
  await renderList([makeEvent()], undefined, { timeZone: "indy" });
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
});
