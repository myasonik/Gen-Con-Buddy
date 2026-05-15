import { http, HttpResponse } from "msw";
import { server } from "./msw/server";

export function withNetworkError(url: string): void {
  server.use(http.get(url, () => HttpResponse.error()));
}

export function withServerError(url: string): void {
  server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
}
