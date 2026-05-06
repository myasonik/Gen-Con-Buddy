import React, { useState, useId, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { Chip } from "../Chip/Chip";
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
  renderChipContent?: (option: MultiComboboxOption, isOpen: boolean) => React.ReactNode;
  renderChipIcon?: (option: MultiComboboxOption) => React.ReactNode;
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
  renderChipIcon,
  renderOptionContent,
  isLoading = false,
}: MultiComboboxProps): React.JSX.Element {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const filter = Combobox.useFilter();

  const selectedValues = value ? value.split(",") : [];

  const defaultFilter = (option: MultiComboboxOption, text: string): boolean =>
    filter.contains(option.value, text) || filter.contains(option.label, text);

  const filteredOptions = filterText
    ? options.filter((opt) => (filterOption ?? defaultFilter)(opt, filterText))
    : options;

  function getOption(val: string): MultiComboboxOption {
    return options.find((o) => o.value === val) ?? { value: val, label: val };
  }

  function removeValue(val: string): void {
    onValueChange(selectedValues.filter((v) => v !== val).join(","));
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
        <label htmlFor={inputId} className={styles.label}>
          {label}
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
            {selectedValues.map((val) => {
              const option = getOption(val);
              return (
                <Chip
                  key={val}
                  tone="accent"
                  icon={renderChipIcon?.(option)}
                  onRemove={() => removeValue(val)}
                  removeLabel={option.label}
                >
                  {renderChipContent ? renderChipContent(option, open) : option.label}
                </Chip>
              );
            })}
            <Combobox.Input
              ref={inputRef}
              id={inputId}
              className={styles.input}
              disabled={isLoading}
              placeholder={getPlaceholder(isLoading, selectedValues.length > 0, label)}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  e.currentTarget.value === "" &&
                  selectedValues.length > 0
                ) {
                  onValueChange(selectedValues.slice(0, -1).join(","));
                }
              }}
            />
          </div>
          <Combobox.Trigger className={styles.trigger} aria-label={`Toggle ${label} list`}>
            <ChevronDown size={14} aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.InputGroup>
        {open && (
          <Combobox.List className={styles.list}>
            {filteredOptions.map((option) => (
              <Combobox.Item
                key={option.value}
                value={option.value}
                aria-label={option.label}
                className={styles.item}
              >
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
        )}
      </Combobox.Root>
    </div>
  );
}
