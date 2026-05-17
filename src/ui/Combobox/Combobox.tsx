import React, { useState, useId } from "react";
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
    <div className={styles.root}>
      <BaseCombobox.Root
        value={value}
        open={open}
        onOpenChange={setOpen}
        onInputValueChange={(text) => setFilterText(text)}
        onValueChange={(newValue) => {
          if (newValue) {
            onSelect(newValue);
            setValue(null);
            setFilterText("");
            setOpen(false);
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
            onFocus={() => setOpen(true)}
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
