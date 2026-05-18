import React, { useState, useId, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxGroup {
  label: string;
  options: ComboboxOption[];
}

interface ComboboxProps {
  label: string;
  placeholder?: string;
  groups: ComboboxGroup[];
  onSelect: (value: string) => void;
}

export function Combobox({
  label,
  placeholder = "Search…",
  groups,
  onSelect,
}: ComboboxProps): React.JSX.Element {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = BaseCombobox.useFilter();
  const labelId = useId();
  // Prevents the focus handler from reopening the dropdown immediately after selection.
  const suppressFocusOpenRef = useRef(false);
  // Suppresses the onInputValueChange fired by Base UI after it fills the input
  // with the selected item's value string (fires after onValueChange).
  const suppressNextInputChangeRef = useRef(false);

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      options: filterText
        ? g.options.filter(
            (opt) =>
              filter.contains(opt.label, filterText) || filter.contains(opt.value, filterText),
          )
        : g.options,
    }))
    .filter((g) => g.options.length > 0);

  const showGroupLabels = filteredGroups.length > 1;
  const totalOptions = filteredGroups.reduce((sum, g) => sum + g.options.length, 0);

  return (
    <div
      className={styles.root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          setFilterText("");
        }
      }}
    >
      <BaseCombobox.Root
        value={value}
        inputValue={filterText}
        open={open}
        onOpenChange={setOpen}
        onInputValueChange={(text) => {
          if (suppressNextInputChangeRef.current) {
            suppressNextInputChangeRef.current = false;
            return;
          }
          setFilterText(text);
        }}
        onValueChange={(newValue) => {
          if (newValue) {
            suppressNextInputChangeRef.current = true;
            onSelect(newValue);
            setValue(null);
            setFilterText("");
            setOpen(false);
            suppressFocusOpenRef.current = true;
          }
        }}
      >
        <label id={labelId} className={styles.label}>
          {label}
        </label>
        <BaseCombobox.InputGroup className={styles.inputGroup}>
          <BaseCombobox.Input
            aria-labelledby={labelId}
            className={styles.input}
            placeholder={placeholder}
            onFocus={() => {
              if (!suppressFocusOpenRef.current) {
                setOpen(true);
              }
              suppressFocusOpenRef.current = false;
            }}
          />
          <BaseCombobox.Trigger
            tabIndex={-1}
            className={styles.trigger}
            aria-label={`Toggle ${label} list`}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </BaseCombobox.Trigger>
        </BaseCombobox.InputGroup>
        <BaseCombobox.Status className="sr-only" />
        {open && (
          <BaseCombobox.Portal>
            <BaseCombobox.Positioner sideOffset={4} className={styles.positioner}>
              {/* Plain div avoids Combobox.Popup's FloatingFocusManager, which would
                  aria-hide sibling elements (parent dialog content). */}
              <div className={styles.popup}>
                <BaseCombobox.List className={styles.list}>
                  {filteredGroups.map((group) =>
                    showGroupLabels ? (
                      <BaseCombobox.Group key={group.label}>
                        <BaseCombobox.GroupLabel className={styles.groupLabel}>
                          {group.label}
                        </BaseCombobox.GroupLabel>
                        {group.options.map((opt) => (
                          <BaseCombobox.Item
                            key={opt.value}
                            value={opt.value}
                            className={styles.item}
                          >
                            <span className={styles.itemName}>{opt.label}</span>
                          </BaseCombobox.Item>
                        ))}
                      </BaseCombobox.Group>
                    ) : (
                      group.options.map((opt) => (
                        <BaseCombobox.Item
                          key={opt.value}
                          value={opt.value}
                          className={styles.item}
                        >
                          <span className={styles.itemName}>{opt.label}</span>
                        </BaseCombobox.Item>
                      ))
                    ),
                  )}
                  {totalOptions === 0 && <div className={styles.empty}>No results</div>}
                </BaseCombobox.List>
              </div>
            </BaseCombobox.Positioner>
          </BaseCombobox.Portal>
        )}
      </BaseCombobox.Root>
    </div>
  );
}
