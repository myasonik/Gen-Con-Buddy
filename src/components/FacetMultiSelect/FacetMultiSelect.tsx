import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "../../ui/MultiCombobox/MultiCombobox";
import { fetchFacets } from "../../utils/api";
import styles from "./FacetMultiSelect.module.css";

export interface FacetMultiSelectProps {
  field: string;
  label: string;
  labelMap?: Record<string, string>;
  value: string;
  onValueChange: (value: string) => void;
}

export function FacetMultiSelect({
  field,
  label,
  labelMap,
  value,
  onValueChange,
}: FacetMultiSelectProps): React.JSX.Element | null {
  const {
    data: facets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["facets", field],
    queryFn: () => fetchFacets(field),
    staleTime: Infinity,
  });

  const countMap = useMemo(() => new Map((facets ?? []).map((f) => [f.value, f.count])), [facets]);

  const options = useMemo(
    () => (facets ?? []).map((f) => ({ value: f.value, label: labelMap?.[f.value] ?? f.value })),
    [facets, labelMap],
  );

  if (isError) {
    return null;
  }

  return (
    <MultiCombobox
      label={label}
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
