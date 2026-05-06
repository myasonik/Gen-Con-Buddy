import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";
import { fetchChangelogEntry, fetchChangelogList } from "../utils/api";
import { parseOpenParam } from "../components/ChangelogPage/openParam";

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.open;
    let open: string[] = [];
    if (Array.isArray(raw)) {
      open = raw.map(String);
    } else if (raw !== undefined && raw !== null) {
      open = [String(raw)];
    }
    return { open };
  },
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
  const { open } = Route.useSearch();
  const navigate = Route.useNavigate();
  const syncOpen = (newOpen: string[]): void => {
    void navigate({ search: (prev) => ({ ...prev, open: newOpen }), replace: true });
  };
  return <ChangelogPage openParam={open} onSyncOpen={syncOpen} />;
}
