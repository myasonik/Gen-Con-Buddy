export const EVENT_TYPES: Record<string, string> = {
  ANI: "ANI - Anime Activities",
  BGM: "BGM - Board Game",
  CGM: "CGM - Non-Collectible / Tradable Card Game",
  EGM: "EGM - Electronic Games",
  ENT: "ENT - Entertainment Events",
  FLM: "FLM - Film Fest",
  HMN: "HMN - Historical Miniatures",
  KID: "KID - Kids Activities",
  LRP: "LRP - LARP",
  MHE: "MHE - Miniature Hobby Events",
  NMN: "NMN - Non-Historical Miniatures",
  RPG: "RPG - Role Playing Game",
  SEM: "SEM - Seminar",
  SPA: "SPA - Supplemental Activities",
  TCG: "TCG - Tradable Card Game",
  TDA: "TDA - True Dungeon Adventures!",
  TRD: "TRD - Trade Day Event",
  WKS: "WKS - Workshop",
  ZED: "ZED - Isle of Misfit Events",
};

export const AGE_GROUPS: Record<string, string> = {
  "kids only (12 and under)": "Kids only (12 and under)",
  "Everyone (6+)": "Everyone (6+)",
  "Teen (13+)": "Teen (13+)",
  "Mature (18+)": "Mature (18+)",
  "21+": "21+",
};

export const EXP: Record<string, string> = {
  "None (You've never played before - rules will be taught)": "None",
  "Some (You've played it a bit and understand the basics)": "Some",
  "Expert (You play it regularly and know all the rules)": "Expert",
};

export const REGISTRATION: Record<string, string> = {
  "Yes, they can register for this round without having played in any other events":
    "Open (ticket required)",
  "No, this event does not require tickets!": "Free (no ticket needed)",
  "VIG-only!": "VIG only",
  "No, this event is invite-only.": "Invite only",
  "No, this is a generic ticket-only event!": "Generic ticket",
  "Trade Day only!": "Trade Day only",
};

export const CATEGORY: Record<string, string> = {
  none: "None",
  "Gen Con presents": "Gen Con presents",
  "Premier Event": "Premier Event",
};

export const EST = "America/New_York";
