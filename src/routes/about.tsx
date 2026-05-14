import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../components/AboutPage/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Gen Con Buddy" },
      {
        name: "description",
        content: "About Gen Con Buddy — a fast event search tool built for Gen Con attendees.",
      },
      { property: "og:title", content: "About | Gen Con Buddy" },
      {
        property: "og:description",
        content: "About Gen Con Buddy — a fast event search tool built for Gen Con attendees.",
      },
    ],
  }),
  component: AboutPage,
});
