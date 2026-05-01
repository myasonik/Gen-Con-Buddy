import { useState, useId, useRef } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { EVENT_TYPES } from "../../utils/enums";
import styles from "./EventTypeSelect.module.css";

export interface EventTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const OPTIONS = Object.entries(EVENT_TYPES).map(([code, label]) => ({
  code,
  label,
  name: label.replace(/^[A-Z]+ - /, ""),
}));

export function EventTypeSelect({ value, onValueChange }: EventTypeSelectProps): JSX.Element {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();

  const selectedCodes = value ? value.split(",") : [];

  const filteredOptions = filterText
    ? OPTIONS.filter(
        ({ code, name }) => filter.contains(code, filterText) || filter.contains(name, filterText),
      )
    : OPTIONS;

  function removeCode(code: string): void {
    onValueChange(selectedCodes.filter((c) => c !== code).join(","));
  }

  return (
    <div className={styles.root}>
      <Combobox.Root
        multiple
        open={open}
        value={selectedCodes}
        onValueChange={(codes) => onValueChange(codes.join(","))}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setFilterText("");
          }
        }}
        onInputValueChange={(text) => setFilterText(text)}
      >
        <label htmlFor={inputId} className={styles.label}>
          Event Type
        </label>
        <Combobox.InputGroup
          className={styles.inputGroup}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) {
              return;
            }
            if (!open) {
              setOpen(true);
            }
            inputRef.current?.focus();
          }}
        >
          <div className={styles.inputGroupInner}>
            {selectedCodes.map((code) => (
              <div key={code} data-testid="chip" className={styles.chip}>
                <span className={styles.chipText}>
                  {code}
                  {open && (
                    <span>
                      {" – "}
                      {EVENT_TYPES[code]?.replace(/^[A-Z]+ - /, "")}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove ${code}`}
                  onClick={() => removeCode(code)}
                >
                  ×
                </button>
              </div>
            ))}
            <Combobox.Input
              ref={inputRef}
              id={inputId}
              className={styles.input}
              placeholder={selectedCodes.length > 0 ? "Add type…" : "Filter types…"}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  e.currentTarget.value === "" &&
                  selectedCodes.length > 0
                ) {
                  onValueChange(selectedCodes.slice(0, -1).join(","));
                }
              }}
            />
          </div>
          <Combobox.Trigger className={styles.trigger} aria-label="Toggle event type list">
            ▾
          </Combobox.Trigger>
        </Combobox.InputGroup>
        {open && (
          <Combobox.List className={styles.list}>
            {filteredOptions.map(({ code, name }) => (
              <Combobox.Item key={code} value={code} aria-label={name} className={styles.item}>
                <span aria-hidden className={styles.itemBadge}>
                  {code}
                </span>
                <span className={styles.itemName}>{name}</span>
                <Combobox.ItemIndicator className={styles.itemIndicator}>✓</Combobox.ItemIndicator>
              </Combobox.Item>
            ))}
          </Combobox.List>
        )}
      </Combobox.Root>
    </div>
  );
}
