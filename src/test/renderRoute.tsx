import { StrictMode } from "react";
import { act, render, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  type AnyRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "../routeTree.gen";
import { parseSearch, stringifySearch } from "../lib/searchSerializer";
import type { SearchParams } from "../utils/searchParamSchema";

export async function renderRoute(
  path: string,
  options?: {
    searchParams?: Partial<SearchParams>;
    queryClient?: QueryClient;
  },
): Promise<{ user: UserEvent; router: AnyRouter } & RenderResult> {
  const client =
    options?.queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });

  let url = path;
  if (options?.searchParams) {
    const entries = Object.entries(options.searchParams).filter(
      ([, v]) => v !== undefined && v !== null,
    ) as [string, string | number][];
    if (entries.length > 0) {
      const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
      url = `${path}?${qs.toString()}`;
    }
  }

  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createRouter({
    routeTree,
    history,
    parseSearch,
    stringifySearch,
    context: { queryClient: client },
  });
  await router.load();

  const user = userEvent.setup();
  const result = render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  await act(async () => {});

  return { user, router, ...result };
}
