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

export const STAFF_PICK_PREAMBLE = "Looks like that quest hit a dead end.";
export const STAFF_PICK_PREAMBLE_DETAIL =
  "If you're still looking for your next adventure, these are some of our favorites at this year's con.";
