import { expect, describe, it, afterEach } from "vitest";
import type { EventSearchResponse } from "../../utils/types";
import { server } from "./server";
import { makeEventPool } from "./handlers";
import { makeEvent } from "./factory";

afterEach(() => server.resetHandlers());

async function fetchEvents(params: Record<string, string> = {}): Promise<EventSearchResponse> {
  const url = new URL("/api/events/search", window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  return res.json();
}

describe("default /api/events/search handler", () => {
  it("returns data with a total count", async () => {
    const data = await fetchEvents();
    expect(data.meta.total).toBeGreaterThan(0);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("returns the correct slice for page=0 limit=5", async () => {
    const data = await fetchEvents({ page: "0", limit: "5" });
    expect(data.data).toHaveLength(5);
    expect(data.meta.total).toBe(20);
  });

  it("returns the correct slice for page=1 limit=5 (second page)", async () => {
    const page0 = await fetchEvents({ page: "0", limit: "5" });
    const page1 = await fetchEvents({ page: "1", limit: "5" });
    expect(page1.data).toHaveLength(5);
    expect(page1.data[0].id).not.toBe(page0.data[0].id);
  });

  it("returns empty data array when page is beyond total", async () => {
    const data = await fetchEvents({ page: "100", limit: "5" });
    expect(data.data).toHaveLength(0);
    expect(data.meta.total).toBe(20);
  });

  it("returns correct total when page and limit are not specified", async () => {
    const data = await fetchEvents();
    expect(data.meta.total).toBe(20);
  });
});

describe("makeEventPool", () => {
  it("returns a handler that uses the provided events", async () => {
    const custom = [
      makeEvent({ title: "Custom Event 1" }),
      makeEvent({ title: "Custom Event 2" }),
      makeEvent({ title: "Custom Event 3" }),
    ];
    server.use(makeEventPool(custom));

    const data = await fetchEvents();
    expect(data.meta.total).toBe(3);
    expect(data.data).toHaveLength(3);
  });

  it("makeEventPool respects page and limit", async () => {
    const custom = Array.from({ length: 6 }, (_, i) => makeEvent({ title: `Event ${i + 1}` }));
    server.use(makeEventPool(custom));

    const page0 = await fetchEvents({ page: "0", limit: "3" });
    expect(page0.data).toHaveLength(3);
    expect(page0.meta.total).toBe(6);

    const page1 = await fetchEvents({ page: "1", limit: "3" });
    expect(page1.data).toHaveLength(3);
    expect(page1.data[0].id).not.toBe(page0.data[0].id);
  });
});
