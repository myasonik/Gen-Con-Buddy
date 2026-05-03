import { expect, test } from "vitest";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "./eventTypeIcons";

test("every EVENT_TYPES key has a corresponding entry in EVENT_TYPE_ICONS", () => {
  const missingKeys = Object.keys(EVENT_TYPES).filter((key) => !(key in EVENT_TYPE_ICONS));
  expect(missingKeys, `EVENT_TYPE_ICONS is missing icons for: ${missingKeys.join(", ")}`).toEqual(
    [],
  );
});

test("every EVENT_TYPE_ICONS key exists in EVENT_TYPES (no orphaned entries)", () => {
  const orphanedKeys = Object.keys(EVENT_TYPE_ICONS).filter((key) => !(key in EVENT_TYPES));
  expect(
    orphanedKeys,
    `EVENT_TYPE_ICONS has orphaned entries not in EVENT_TYPES: ${orphanedKeys.join(", ")}`,
  ).toEqual([]);
});

test("each value in EVENT_TYPE_ICONS is a React component", () => {
  for (const [key, Icon] of Object.entries(EVENT_TYPE_ICONS)) {
    expect(
      typeof Icon === "function" || (Icon !== null && typeof Icon === "object" && "displayName" in Icon),
      `EVENT_TYPE_ICONS["${key}"] is not a React component`,
    ).toBe(true);
  }
});
