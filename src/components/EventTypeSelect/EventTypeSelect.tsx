import React, { useState, useId, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { Chip } from "../../ui/Chip/Chip";
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

export function EventTypeSelect({ value, onValueChange }: EventTypeSelectProps): React.JSX.Element {
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
    <div
      className={styles.root}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setFilterText("");
        }
      }}
    >
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
            {selectedCodes.map((code) => {
              const ChipIcon = EVENT_TYPE_ICONS[code];
              return (
                <Chip
                  key={code}
                  data-testid="chip"
                  tone="accent"
                  icon={ChipIcon ? <ChipIcon size={12} /> : undefined}
                  onRemove={() => removeCode(code)}
                >
                  {code}
                  {open && (
                    <span>
                      {" – "}
                      {EVENT_TYPES[code]?.replace(/^[A-Z]+ - /, "")}
                    </span>
                  )}
                </Chip>
              );
            })}
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
            <ChevronDown size={14} aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.InputGroup>
        {open && (
          <Combobox.List className={styles.list}>
            {filteredOptions.map(({ code, name }) => {
              const ItemIcon = EVENT_TYPE_ICONS[code];
              return (
                <Combobox.Item key={code} value={code} aria-label={name} className={styles.item}>
                  {ItemIcon && <ItemIcon size={16} aria-hidden="true" />}
                  <span aria-hidden className={styles.itemBadge}>
                    {code}
                  </span>
                  <span className={styles.itemName}>{name}</span>
                  <Combobox.ItemIndicator className={styles.itemIndicator}>
                    <Check size={12} aria-hidden="true" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              );
            })}
          </Combobox.List>
        )}
      </Combobox.Root>
    </div>
  );
}
