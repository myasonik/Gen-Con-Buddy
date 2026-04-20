import React, { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_COLORS } from "../../utils/conceptColors";
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

export function EventTypeSelect({
  value,
  onValueChange,
}: EventTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();

  const selectedCodes = value ? value.split(",") : [];

  const filteredOptions = filterText
    ? OPTIONS.filter(
        ({ code, name }) =>
          filter.contains(code, filterText) ||
          filter.contains(name, filterText),
      )
    : OPTIONS;

  function removeCode(code: string) {
    onValueChange(selectedCodes.filter((c) => c !== code).join(","));
  }

  return (
    <Combobox.Root
      multiple
      value={selectedCodes}
      onValueChange={(codes) => onValueChange(codes.join(","))}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setFilterText("");
      }}
      onInputValueChange={(text) => setFilterText(text)}
      className={styles.root}
    >
      <label htmlFor="event-type-input" className={styles.label}>
        Event Type
      </label>
      <Combobox.InputGroup className={styles.inputGroup}>
        {selectedCodes.map((code) => {
          const colors = EVENT_TYPE_COLORS[code];
          return (
            <div
              key={code}
              data-testid="chip"
              className={styles.chip}
              style={
                colors
                  ? ({
                      "--chip-color": colors.color,
                      "--chip-bg": colors.bg,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <span className={styles.chipLabel}>
                {code}
                {open && (
                  <span className={styles.chipFullName}>
                    {" \u2013 "}
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
          );
        })}
        <Combobox.Input
          id="event-type-input"
          className={styles.input}
          placeholder={
            selectedCodes.length > 0 ? "Add type\u2026" : "Filter types\u2026"
          }
        />
        <Combobox.Trigger
          className={styles.trigger}
          aria-label="Toggle event type list"
        >
          ▾
        </Combobox.Trigger>
      </Combobox.InputGroup>
      {open && (
        <Combobox.List className={styles.list}>
          {filteredOptions.map(({ code, name }) => {
            const colors = EVENT_TYPE_COLORS[code];
            // Break substring match: "Non-Historical Miniatures" would otherwise match
            // `/Historical Miniatures/`. Insert ZWSP (U+200B) into longer names that
            // contain another item's name as a suffix.
            const safeLabel =
              name.includes("Historical Miniatures") &&
              name !== "Historical Miniatures"
                ? name.replace(
                    "Historical Miniatures",
                    "Historical\u200b Miniatures",
                  )
                : name;
            return (
              <Combobox.Item
                key={code}
                value={code}
                aria-label={safeLabel}
                className={styles.item}
              >
                <span
                  aria-hidden
                  className={styles.itemBadge}
                  style={
                    colors
                      ? ({
                          "--chip-color": colors.color,
                          "--chip-bg": colors.bg,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {code}
                </span>
                <span className={styles.itemName}>{name}</span>
                <Combobox.ItemIndicator className={styles.itemIndicator}>
                  ✓
                </Combobox.ItemIndicator>
              </Combobox.Item>
            );
          })}
        </Combobox.List>
      )}
    </Combobox.Root>
  );
}
