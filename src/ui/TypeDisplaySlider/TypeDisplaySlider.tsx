import { useId } from "react";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";
import styles from "./TypeDisplaySlider.module.css";

const OPTIONS: TypeDisplay[] = ["code", "name", "both"];
const LABELS: Record<TypeDisplay, string> = { code: "Code", name: "Name", both: "Both" };

interface TypeDisplaySliderProps {
  value: TypeDisplay;
  onChange: (value: TypeDisplay) => void;
}

export function TypeDisplaySlider({ value, onChange }: TypeDisplaySliderProps): JSX.Element {
  const listId = useId();
  return (
    <div className={styles.root}>
      <div className={styles.track}>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={OPTIONS.indexOf(value)}
          list={listId}
          aria-label="Type display"
          aria-valuetext={LABELS[value]}
          className={styles.input}
          onChange={(e) => {
            const next = OPTIONS[Number(e.target.value)];
            if (next) {
              onChange(next);
            }
          }}
        />
        <datalist id={listId}>
          <option value="0" />
          <option value="1" />
          <option value="2" />
        </datalist>
      </div>
      <div className={styles.labels} aria-hidden="true">
        {OPTIONS.map((opt) => (
          <span key={opt}>{LABELS[opt]}</span>
        ))}
      </div>
    </div>
  );
}
