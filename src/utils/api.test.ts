import { http, HttpResponse } from "msw";
import { server } from "../test/msw/server";
import { fetchEvents } from "./api";
import type { EventSearchResponse } from "./types";

const EMPTY_RESPONSE: EventSearchResponse = {
  data: [],
  meta: { total: 0 },
  links: { self: "/api/events/search" },
  error: null,
};

function captureUrl(): { getUrl: () => URL | null } {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json(EMPTY_RESPONSE);
    }),
  );
  return { getUrl: () => capturedUrl };
}

test("serializes single eventType code directly", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe("BGM");
});

test("serializes multiple eventType codes as comma-separated", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "RPG,BGM" });
  expect(getUrl()?.searchParams.get("eventType")).toBe("RPG,BGM");
});

test("omits eventType when value is empty string", async () => {
  const { getUrl } = captureUrl();
  await fetchEvents({ eventType: "" });
  expect(getUrl()?.searchParams.has("eventType")).toBe(false);
});
