import type React from "react";
import type { LucideProps } from "lucide-react";
import { CombinationLock } from "./CombinationLock";
import { RollingDices } from "./RollingDices";
import { PokerHand } from "./PokerHand";
import { Gamepad } from "./Gamepad";
import { DramaMasks } from "./DramaMasks";
import { Clapperboard } from "./Clapperboard";
import { Cannon } from "./Cannon";
import { SpinningTop } from "./SpinningTop";
import { CrossedSwords } from "./CrossedSwords";
import { PaintBrush } from "./PaintBrush";
import { DragonHead } from "./DragonHead";
import { DiceTwentyFacesTwenty } from "./DiceTwentyFacesTwenty";
import { PublicSpeaker } from "./PublicSpeaker";
import { PartyPopper } from "./PartyPopper";
import { CardExchange } from "./CardExchange";
import { DungeonGate } from "./DungeonGate";
import { Trade } from "./Trade";
import { Anvil } from "./Anvil";
import { JesterHat } from "./JesterHat";

export const EVENT_TYPE_ICONS: Record<
  string,
  React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
> = {
  BGM: RollingDices,
  CGM: PokerHand,
  EGM: Gamepad,
  ESC: CombinationLock,
  ENT: DramaMasks,
  FLM: Clapperboard,
  HMN: Cannon,
  KID: SpinningTop,
  LRP: CrossedSwords,
  MHE: PaintBrush,
  NMN: DragonHead,
  RPG: DiceTwentyFacesTwenty,
  SEM: PublicSpeaker,
  SPA: PartyPopper,
  TCG: CardExchange,
  TDA: DungeonGate,
  TRD: Trade,
  WKS: Anvil,
  ZED: JesterHat,
};
