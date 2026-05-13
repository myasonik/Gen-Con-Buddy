export const WILDHAVENS_GAME_IDS: readonly string[] = [
  "BGM26ND310303",
  "BGM26ND310286",
  "BGM26ND310299",
  "BGM26ND310301",
  "BGM26ND310296",
  "BGM26ND310298",
  "BGM26ND310302",
] as const;

export const STAFF_PICK_IDS: ReadonlySet<string> = new Set(WILDHAVENS_GAME_IDS);

export const STAFF_PICK_GROUP = "Wildhavens";
export const STAFF_PICK_HEADING = "Staff Picks";
export const STAFF_PICK_SUBTEXT = "Our picks for best new publisher at Gen Con 2026";
