import React from "react";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { MultiCombobox, type MultiComboboxOption } from "../../ui/MultiCombobox/MultiCombobox";
import styles from "./EventTypeSelect.module.css";

export interface EventTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const OPTIONS: MultiComboboxOption[] = Object.entries(EVENT_TYPES).map(([code, label]) => ({
  value: code,
  label: label.replace(/^[A-Z]+ - /, ""),
}));

export function EventTypeSelect({ value, onValueChange }: EventTypeSelectProps): React.JSX.Element {
  return (
    <MultiCombobox
      label="Event Type"
      value={value}
      onValueChange={onValueChange}
      options={OPTIONS}
      renderRemoveLabel={(option) => option.value}
      renderChipIcon={(option) => {
        const Icon = EVENT_TYPE_ICONS[option.value];
        return Icon ? <Icon size={12} aria-hidden="true" /> : undefined;
      }}
      renderChipContent={(option) => option.value}
      expandedChipContent={(option) => (
        <span>
          {" – "}
          {option.label}
        </span>
      )}
      renderOptionContent={(option) => {
        const Icon = EVENT_TYPE_ICONS[option.value];
        return (
          <>
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span aria-hidden className={styles.itemBadge}>
              {option.value}
            </span>
            <span className={styles.itemName}>{option.label}</span>
          </>
        );
      }}
    />
  );
}
