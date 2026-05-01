import { useRef, useCallback, type MouseEvent } from "react";

export function useAnimatedDetails(): {
  ref: React.RefObject<HTMLDetailsElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  onSummaryClick: (e: MouseEvent) => void;
} {
  const ref = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const onSummaryClick = useCallback((e: MouseEvent): void => {
    const details = ref.current;
    if (!details) {
      return;
    }

    const div = contentRef.current;

    if (details.open) {
      e.preventDefault();
      details.classList.add("is-closing", "is-animating");

      const finish = (): void => {
        details.classList.remove("is-closing", "is-animating");
        details.open = false;
      };

      if (div) {
        div.addEventListener("transitionend", finish, { once: true });
      } else {
        finish();
      }
    } else {
      details.classList.add("is-animating");

      if (div) {
        div.addEventListener(
          "transitionend",
          () => {
            details.classList.remove("is-animating");
          },
          { once: true },
        );
      } else {
        details.classList.remove("is-animating");
      }
    }
  }, []);

  return { ref, contentRef, onSummaryClick };
}
