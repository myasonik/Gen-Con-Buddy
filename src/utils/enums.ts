export const EVENT_TYPES: Record<string, string> = {
  BGM: "BGM - Board Game",
  CGM: "CGM - Non-Collectible / Tradable Card Game",
  EGM: "EGM - Electronic Games",
  ESC: "ESC - Escape Rooms",
  ENT: "ENT - Entertainment Events",
  FLM: "FLM - Film Festival",
  HMN: "HMN - Historical Miniatures",
  KID: "KID - Kids Activities",
  LRP: "LRP - LARP",
  MHE: "MHE - Miniature Hobby Events",
  NMN: "NMN - Non-Historical Miniatures",
  RPG: "RPG - Roleplaying Game",
  SEM: "SEM - Seminar",
  SPA: "SPA - Supplemental Activities",
  TCG: "TCG - Tradable Card Game",
  TDA: "TDA - True Dungeon Adventures!",
  TRD: "TRD - Trade Day Events",
  WKS: "WKS - Workshop",
  ZED: "ZED - Isle of Misfit Events",
};

export const AGE_GROUPS: Record<string, string> = {
  kids: "Kids only (12 and under)",
  everyone: "Everyone (6+)",
  teen: "Teen (13+)",
  mature: "Mature (18+)",
  drinking: "21+",
};

export const AGE_VALUE_MAP: Record<string, string> = {
  "kids only (12 and under)": "kids",
  "Everyone (6+)": "everyone",
  "Teen (13+)": "teen",
  "Mature (18+)": "mature",
  "21+": "drinking",
};

export const EXP: Record<string, string> = {
  none: "None",
  some: "Some",
  expert: "Expert",
};

export const EXP_VALUE_MAP: Record<string, string> = {
  "None (You've never played before - rules will be taught)": "none",
  "Some (You've played it a bit and understand the basics)": "some",
  "Expert (You play it regularly and know all the rules)": "expert",
};

export const REGISTRATION: Record<string, string> = {
  open: "Open (ticket required)",
  free: "Free (no ticket needed)",
  vig: "VIG only",
  invite: "Invite only",
  generic: "Generic ticket",
  tradeDay: "Trade Day only",
};

export const REGISTRATION_VALUE_MAP: Record<string, string> = {
  "Yes, they can register for this round without having played in any other events": "open",
  "No, this event does not require tickets!": "free",
  "VIG-only!": "vig",
  "No, this event is invite-only.": "invite",
  "No, this is a generic ticket-only event!": "generic",
  "Trade Day only!": "tradeDay",
};

export const CATEGORY: Record<string, string> = {
  none: "None",
  official: "Gen Con presents",
  premier: "Premier Event",
};

export const CATEGORY_VALUE_MAP: Record<string, string> = {
  none: "none",
  "Gen Con presents": "official",
  "Premier Event": "premier",
};

export const YES_NO: Record<string, string> = {
  Yes: "Yes",
  No: "No",
};
