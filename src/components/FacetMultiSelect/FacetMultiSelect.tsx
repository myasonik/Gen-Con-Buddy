import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "../../ui/MultiCombobox/MultiCombobox";
import { fetchFacets } from "../../utils/api";
import styles from "./FacetMultiSelect.module.css";

export interface FacetMultiSelectProps {
  field: string;
  label: string;
  labelMap?: Record<string, string>;
  valueMap?: Record<string, string>;
  value: string;
  onValueChange: (value: string) => void;
}

export function FacetMultiSelect({
  field,
  label,
  labelMap,
  valueMap,
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

  const options = useMemo(
    () =>
      (facets ?? []).map((f) => {
        const key = valueMap?.[f.value] ?? f.value;
        const optionLabel = labelMap?.[key] ?? key;
        const stripped = optionLabel.replace(/\s+\([^)]*\)$/, "");
        const shortLabel = stripped !== optionLabel ? stripped : undefined;
        return { value: key, label: optionLabel, shortLabel, count: f.count };
      }),
    [facets, valueMap, labelMap],
  );

  const countMap = useMemo(() => new Map(options.map((o) => [o.value, o.count])), [options]);

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
