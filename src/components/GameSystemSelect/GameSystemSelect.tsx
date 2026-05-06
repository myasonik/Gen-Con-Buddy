import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "../../ui/MultiCombobox/MultiCombobox";
import { fetchGameSystemFacets } from "../../utils/api";
import styles from "./GameSystemSelect.module.css";

export interface GameSystemSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function GameSystemSelect({
  value,
  onValueChange,
}: GameSystemSelectProps): React.JSX.Element | null {
  const {
    data: facets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["gameSystemFacets"],
    queryFn: fetchGameSystemFacets,
    staleTime: Infinity,
  });

  if (isError) {
    return null;
  }

  const options = (facets ?? []).map((f) => ({ value: f.value, label: f.value }));

  return (
    <MultiCombobox
      label="Game System"
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      renderOptionContent={(option) => {
        const facet = facets?.find((f) => f.value === option.value);
        return (
          <>
            <span className={styles.optionName}>{option.label}</span>
            {facet !== undefined && <span className={styles.optionCount}>{facet.count}</span>}
          </>
        );
      }}
    />
  );
}
