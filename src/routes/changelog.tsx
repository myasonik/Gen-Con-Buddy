import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";
import { fetchChangelogEntry, fetchChangelogList } from "../utils/api";
import { parseOpenParam } from "../components/ChangelogPage/openParam";

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (value !== undefined && value !== null) {
    return [String(value)];
  }
  return [];
}

function coerceString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => ({
    open: coerceStringArray(search.open),
    eventType: coerceString(search.eventType),
    days: coerceString(search.days),
    timeStart: coerceString(search.timeStart),
    timeEnd: coerceString(search.timeEnd),
  }),
  loaderDeps: ({ search }) => ({ open: search.open }),
  loader: async ({ deps, context }) => {
    const { queryClient } = context;
    const summaries = await queryClient.ensureQueryData({
      queryKey: ["changelog", "list"],
      queryFn: () => fetchChangelogList(),
    });
    const openPositions = parseOpenParam(deps.open);
    await Promise.all(
      Array.from(openPositions.keys())
        .map((pos) => summaries[pos - 1])
        .filter((s): s is NonNullable<typeof s> => s !== undefined)
        .map((s) =>
          queryClient.ensureQueryData({
            queryKey: ["changelog", "entry", s.id],
            queryFn: () => fetchChangelogEntry(s.id),
          }),
        ),
    );
  },
  component: ChangelogPageRoute,
});

function ChangelogPageRoute(): React.JSX.Element {
  const { open, eventType, days, timeStart, timeEnd } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ChangelogPage
      openParam={open}
      navigate={navigate}
      eventType={eventType}
      days={days}
      timeStart={timeStart}
      timeEnd={timeEnd}
    />
  );
}
