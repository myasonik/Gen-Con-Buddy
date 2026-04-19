import { useEffect } from "react";
import { announce } from "../../lib/announce";
import styles from "./PixelState.module.css";

interface PixelStateProps {
  variant: "loading" | "empty" | "error";
  text: string;
  subtext?: string;
}

export function PixelState({ variant, text, subtext }: PixelStateProps) {
  useEffect(() => {
    announce(text, variant === "error" ? "assertive" : "polite");
  }, [variant, text]);

  return (
    <div className={styles.state}>
      {variant === "loading" && (
        <div className={styles.progressBar} data-testid="progress-bar">
          <div className={styles.progressFill} />
        </div>
      )}
      {variant === "empty" && (
        <div className={styles.die} aria-hidden="true">
          ⚄
        </div>
      )}
      {variant === "error" && (
        <div className={styles.die} aria-hidden="true">
          ✗
        </div>
      )}
      <p className={styles.text}>{text}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
}
