import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.open;
    let open: string[];
    if (Array.isArray(raw)) {
      open = raw.map(String);
    } else if (raw !== undefined && raw !== null) {
      open = [String(raw)];
    } else {
      open = [];
    }
    return { open };
  },
  component: ChangelogPageRoute,
});

function ChangelogPageRoute(): React.JSX.Element {
  const { open } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ChangelogPage openParam={open} navigate={navigate} />;
}
