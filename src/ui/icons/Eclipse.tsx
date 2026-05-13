import { createIcon } from "./createIcon";

// game-icons.net — "eclipse" by lorc (CC BY 3.0)
// Half-filled circle: left half solid, right half outlined — communicates "split/auto"
export const Eclipse = createIcon(
  "Eclipse",
  "0 0 512 512",
  <>
    <path d="M256 32A224 224 0 1 0 256 480A224 224 0 1 0 256 32z" fillOpacity="0.25" />
    <path d="M256 32A224 224 0 0 1 256 480V32z" />
  </>,
);
