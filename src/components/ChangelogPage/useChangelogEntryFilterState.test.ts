import { expect, test } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeChangelogEntry, makeEvent } from "../../test/msw/factory";
import { useChangelogEntryFilterState } from "./useChangelogEntryFilterState";

function makeWrapper(
  client: QueryClient,
): ({ children }: { children: React.ReactNode }) => React.ReactNode {
  return ({ children }) => React.createElement(QueryClientProvider, { client }, children);
}

test("returns idle when no activeFilter is provided", () => {
  const client = new QueryClient();
  const { result } = renderHook(() => useChangelogEntryFilterState("entry-1", undefined), {
    wrapper: makeWrapper(client),
  });
  expect(result.current).toStrictEqual({ kind: "idle" });
});

test("returns unknown when filter is active but entry is not in cache", () => {
  const client = new QueryClient();
  const { result } = renderHook(
    () => useChangelogEntryFilterState("entry-1", { eventType: "RPG" }),
    { wrapper: makeWrapper(client) },
  );
  expect(result.current).toStrictEqual({ kind: "unknown" });
});

test("returns active with hasMatches true when cached entry has matching events", () => {
  const client = new QueryClient();
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" }), makeEvent({ eventType: "BGM" })],
      updatedEvents: [makeEvent({ eventType: "RPG" })],
      deletedEvents: [],
    }),
  );
  const { result } = renderHook(
    () => useChangelogEntryFilterState("entry-1", { eventType: "RPG" }),
    { wrapper: makeWrapper(client) },
  );
  expect(result.current).toStrictEqual({
    kind: "active",
    filtered: { created: 1, updated: 1, deleted: 0 },
    hasMatches: true,
  });
});

test("returns active with hasMatches false when cached entry has no matching events", () => {
  const client = new QueryClient();
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "BGM" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  const { result } = renderHook(
    () => useChangelogEntryFilterState("entry-1", { eventType: "RPG" }),
    { wrapper: makeWrapper(client) },
  );
  expect(result.current).toStrictEqual({
    kind: "active",
    filtered: { created: 0, updated: 0, deleted: 0 },
    hasMatches: false,
  });
});

test("counts matching events separately across created, updated, and deleted buckets", () => {
  const client = new QueryClient();
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [
        makeEvent({ eventType: "RPG" }),
        makeEvent({ eventType: "RPG" }),
        makeEvent({ eventType: "BGM" }),
      ],
      updatedEvents: [makeEvent({ eventType: "RPG" })],
      deletedEvents: [makeEvent({ eventType: "BGM" }), makeEvent({ eventType: "BGM" })],
    }),
  );
  const { result } = renderHook(
    () => useChangelogEntryFilterState("entry-1", { eventType: "RPG" }),
    { wrapper: makeWrapper(client) },
  );
  expect(result.current).toStrictEqual({
    kind: "active",
    filtered: { created: 2, updated: 1, deleted: 0 },
    hasMatches: true,
  });
});

test("returns idle when activeFilter has no relevant fields set", () => {
  const client = new QueryClient();
  const { result } = renderHook(
    () => useChangelogEntryFilterState("entry-1", { gameSystem: "D&D" }),
    { wrapper: makeWrapper(client) },
  );
  expect(result.current).toStrictEqual({ kind: "idle" });
});
