import { useStoredState } from "./useStoredState";
import type { TypeDisplay } from "../ui/EventTable/types";

const STORAGE_KEY = "gen-con-buddy-type-display";
const VERSION = 2;

interface TypeDisplayState {
  textMode: TypeDisplay;
  showIcon: boolean;
}

const DEFAULTS: TypeDisplayState = {
  textMode: "name",
  showIcon: true,
};

export function useTypeDisplay(): {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  reset: () => void;
} {
  const [state, setState] = useStoredState<TypeDisplayState>(STORAGE_KEY, VERSION, {
    ...DEFAULTS,
  });

  const setTypeDisplay = (v: TypeDisplay): void => {
    setState((prev) => ({ ...prev, textMode: v }));
  };

  const setShowTypeIcon = (v: boolean): void => {
    setState((prev) => ({ ...prev, showIcon: v }));
  };

  const reset = (): void => {
    setState({ ...DEFAULTS });
  };

  return {
    typeDisplay: state.textMode,
    setTypeDisplay,
    showTypeIcon: state.showIcon,
    setShowTypeIcon,
    reset,
  };
}
