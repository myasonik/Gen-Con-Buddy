import React from "react";

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

export function MultiCombobox(_props: MultiComboboxProps): React.JSX.Element {
  return <div />;
}
