export interface ConceptColor {
  color: string;
  bg: string;
}

const ROLEPLAY: ConceptColor = { color: "#5c3a7a", bg: "#f0eaf7" };
const BOARD_CARD: ConceptColor = { color: "#2a5c3a", bg: "#e8f2ea" };
const MINIATURES: ConceptColor = { color: "#1a3d5c", bg: "#e4edf5" };
const ELECTRONIC: ConceptColor = { color: "#7a4a00", bg: "#fdf0d8" };
const LEARNING: ConceptColor = { color: "#1a5c5c", bg: "#e4f2f2" };
const ENTERTAINMENT: ConceptColor = { color: "#7a2040", bg: "#f5e4ea" };

export const EVENT_TYPE_COLORS: Record<string, ConceptColor> = {
  RPG: ROLEPLAY,
  LRP: ROLEPLAY,
  TDA: ROLEPLAY,
  BGM: BOARD_CARD,
  CGM: BOARD_CARD,
  TCG: BOARD_CARD,
  HMN: MINIATURES,
  NMN: MINIATURES,
  MHE: MINIATURES,
  EGM: ELECTRONIC,
  SEM: LEARNING,
  WKS: LEARNING,
  ANI: ENTERTAINMENT,
  ENT: ENTERTAINMENT,
  FLM: ENTERTAINMENT,
  KID: ENTERTAINMENT,
  SPA: ENTERTAINMENT,
  TRD: ENTERTAINMENT,
  ZED: ENTERTAINMENT,
};

export const DAY_COLORS: Record<string, ConceptColor> = {
  Wednesday: { color: "#4a3570", bg: "#edeaf7" },
  Thursday: { color: "#7a4a00", bg: "#fdf0d8" },
  Friday: { color: "#2a5c3a", bg: "#e8f2ea" },
  Saturday: { color: "#1a3d5c", bg: "#e4edf5" },
  Sunday: { color: "#7a2040", bg: "#f5e4ea" },
};

export const EXPERIENCE_COLORS: Record<string, ConceptColor> = {
  "None (You've never played before - rules will be taught)": {
    color: "#2a5c3a",
    bg: "#e8f2ea",
  },
  "Some (You've played it a bit and understand the basics)": {
    color: "#7a4a00",
    bg: "#fdf0d8",
  },
  "Expert (You play it regularly and know all the rules)": {
    color: "#7a2040",
    bg: "#f5e4ea",
  },
};
