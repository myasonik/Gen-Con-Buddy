import React, { useMemo } from "react";
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

  const countMap = useMemo(() => new Map((facets ?? []).map((f) => [f.value, f.count])), [facets]);
  const options = useMemo(
    () => (facets ?? []).map((f) => ({ value: f.value, label: f.value })),
    [facets],
  );

  if (isError) {
    return null;
  }

  return (
    <MultiCombobox
      label="Game System"
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      renderOptionContent={(option) => {
        const count = countMap.get(option.value);
        return (
          <>
            <span className={styles.optionName}>{option.label}</span>
            {count !== undefined && (
              <span className={styles.optionCount} aria-hidden="true">
                {count}
              </span>
            )}
          </>
        );
      }}
    />
  );
}
