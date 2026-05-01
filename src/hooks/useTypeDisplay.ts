import { useStoredState } from "./useStoredState";

export type TypeDisplay = "code" | "name" | "both";

const STORAGE_KEY = "gen-con-buddy-type-display";
const VERSION = 1;
const DEFAULT: TypeDisplay = "both";

export function useTypeDisplay(): {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (value: TypeDisplay) => void;
  reset: () => void;
} {
  const [typeDisplay, setStored] = useStoredState<TypeDisplay>(STORAGE_KEY, VERSION, DEFAULT);
  return {
    typeDisplay,
    setTypeDisplay: (value: TypeDisplay): void => setStored(value),
    reset: (): void => setStored(DEFAULT),
  };
}
