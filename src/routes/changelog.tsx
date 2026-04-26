import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/changelog")({
  component: () => (
    <main>
      <p>Changelog</p>
    </main>
  ),
});
