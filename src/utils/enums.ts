export const EVENT_TYPES: Record<string, string> = {
  SEM: 'SEM - Seminar',
  ZED: 'ZED - Isle of Misfit Events',
  ENT: 'ENT - Entertainment Events',
  RPG: 'RPG - Role Playing Game',
  BGM: 'BGM - Board Game',
  CGM: 'CGM - Non-Collectible / Tradable Card Game',
  WKS: 'WKS - Workshop',
  MHE: 'MHE - Miniature Hobby Events',
  LRP: 'LRP - LARP',
  TRD: 'TRD - Trade Day Event',
  HMN: 'HMN - Historical Miniatures',
  NMN: 'NMN - Non-Historical Miniatures',
  TCG: 'TCG - Tradable Card Game',
  FLM: 'FLM - Film Fest',
  KID: 'KID - Kids Activities',
  ANI: 'ANI - Anime Activities',
}

export const AGE_GROUPS: Record<string, string> = {
  kids: 'Kids only (12 and under)',
  everyone: 'Everyone (6+)',
  teen: 'Teen (13+)',
  mature: 'Mature (18+)',
  drinking: '21+',
}

export const EXP: Record<string, string> = {
  none: "None (You've never played before - rules will be taught)",
  some: "Some (You've played it a bit and understand the basics)",
  expert: 'Expert (You play it regularly and know all the rules)',
}

export const REGISTRATION: Record<string, string> = {
  open: 'Yes, they can register for this round without having played in any other events',
  free: 'No, this event does not require tickets!',
  vig: 'VIG-only!',
  invite: 'No, this event is invite-only.',
}

export const CATEGORY: Record<string, string> = {
  none: 'None',
  official: 'Gen Con presents',
  premier: 'Premier Event',
}

export const EST = 'America/New_York'
