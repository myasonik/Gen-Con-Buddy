import { useRef, useCallback, type RefObject, type MouseEvent } from "react";

export function useAnimatedDetails(): {
  ref: RefObject<HTMLDetailsElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
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
      e.preventDefault();
      // is-opening overrides [open]'s 1fr rule so the before-change style
      // stays at 0fr. Removed after the forced reflow to let the transition fire.
      details.classList.add("is-animating", "is-opening");
      details.open = true;
      void details.offsetHeight; // commit 0fr before transition
      details.classList.remove("is-opening"); // grid-template-rows: 0fr → 1fr, transition fires

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
