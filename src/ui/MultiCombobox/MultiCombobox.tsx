import React, { useState, useRef, useId } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import styles from "./MultiCombobox.module.css";

export interface MultiComboboxOption {
  value: string;
  label: string;
}

export interface MultiComboboxProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: MultiComboboxOption[];
  filterOption?: (option: MultiComboboxOption, filterText: string) => boolean;
  renderChipContent?: (option: MultiComboboxOption) => React.ReactNode;
  /** Extra content appended to chips only while the component has focus. */
  expandedChipContent?: (option: MultiComboboxOption) => React.ReactNode;
  renderChipIcon?: (option: MultiComboboxOption) => React.ReactNode;
  renderRemoveLabel?: (option: MultiComboboxOption) => string;
  renderOptionContent?: (option: MultiComboboxOption) => React.ReactNode;
  isLoading?: boolean;
}

function getPlaceholder(isLoading: boolean, hasValues: boolean, label: string): string {
  if (isLoading) {
    return "Loading…";
  }
  if (hasValues) {
    return "Add…";
  }
  return `Filter ${label.toLowerCase()}…`;
}

export function MultiCombobox({
  label,
  value,
  onValueChange,
  options,
  filterOption,
  renderChipContent,
  expandedChipContent,
  renderChipIcon,
  renderRemoveLabel,
  renderOptionContent,
  isLoading = false,
}: MultiComboboxProps): React.JSX.Element {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();
  // Prevents chip-removal's programmatic input.focus() from reopening the dropdown.
  // Set on ChipRemove pointerdown; cleared on the next Input focus event.
  const suppressFocusOpenRef = useRef(false);

  const selectedValues = value ? value.split(",") : [];

  const defaultFilter = (option: MultiComboboxOption, text: string): boolean =>
    filter.contains(option.value, text) || filter.contains(option.label, text);

  const filteredOptions = filterText
    ? options.filter((opt) => (filterOption ?? defaultFilter)(opt, filterText))
    : options;

  function getOption(val: string): MultiComboboxOption {
    return options.find((o) => o.value === val) ?? { value: val, label: val };
  }

  return (
    <div
      className={styles.root}
      onFocus={() => setHasFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHasFocus(false);
          setOpen(false);
          setFilterText("");
        }
      }}
    >
      <Combobox.Root
        multiple
        open={open}
        value={selectedValues}
        onValueChange={(values) => onValueChange(values.join(","))}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setFilterText("");
          }
        }}
        onInputValueChange={(text) => setFilterText(text)}
      >
        <label id={labelId} className={styles.label}>
          {label}
        </label>
        <Combobox.InputGroup className={styles.inputGroup}>
          <div className={styles.inputGroupInner} data-testid="chip-input-row">
            <Combobox.Chips className={styles.chips}>
              {selectedValues.map((val) => {
                const option = getOption(val);
                return (
                  <Combobox.Chip key={val} className={styles.chip} data-tone="accent">
                    {renderChipIcon != null && (
                      <span className={styles.chipIcon} aria-hidden="true">
                        {renderChipIcon(option)}
                      </span>
                    )}
                    <span className={styles.chipLabel}>
                      {renderChipContent ? renderChipContent(option) : option.label}
                      {hasFocus && expandedChipContent ? expandedChipContent(option) : null}
                    </span>
                    <Combobox.ChipRemove
                      className={styles.chipRemove}
                      aria-label={`Remove ${renderRemoveLabel ? renderRemoveLabel(option) : option.label}`}
                      onPointerDown={() => {
                        suppressFocusOpenRef.current = true;
                      }}
                    >
                      <X size={10} aria-hidden="true" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                );
              })}
            </Combobox.Chips>
            <Combobox.Input
              aria-labelledby={labelId}
              className={styles.input}
              disabled={isLoading}
              placeholder={getPlaceholder(isLoading, selectedValues.length > 0, label)}
              onFocus={() => {
                if (!suppressFocusOpenRef.current) {
                  setOpen(true);
                }
                suppressFocusOpenRef.current = false;
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !filterText && selectedValues.length > 0) {
                  onValueChange(selectedValues.slice(0, -1).join(","));
                }
              }}
            />
          </div>
          <Combobox.Trigger
            tabIndex={-1}
            className={styles.trigger}
            aria-label={`Toggle ${label} list`}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Status className="sr-only" />
        {open && (
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={4} className={styles.positioner}>
              {/* Plain div avoids Combobox.Popup's FloatingFocusManager, which would
                  aria-hide sibling elements (chips toolbar, parent dialog content). */}
              <div className={styles.popup}>
                <Combobox.List className={styles.list}>
                  {filteredOptions.map((option) => (
                    <Combobox.Item key={option.value} value={option.value} className={styles.item}>
                      {renderOptionContent ? (
                        renderOptionContent(option)
                      ) : (
                        <span className={styles.itemName}>{option.label}</span>
                      )}
                      <Combobox.ItemIndicator className={styles.itemIndicator}>
                        <Check size={12} aria-hidden="true" />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  ))}
                </Combobox.List>
                {filteredOptions.length === 0 && <div className={styles.empty}>No results</div>}
              </div>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
}
