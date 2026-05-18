import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "../../ui/Select/Select";
import { fetchFacets } from "../../utils/api";
import styles from "./FacetSelect.module.css";

export interface FacetSelectProps {
  field: string;
  label: string;
  labelMap: Record<string, string>;
  valueMap?: Record<string, string>;
  value: string;
  onValueChange: (value: string) => void;
}

export function FacetSelect({
  field,
  label,
  labelMap,
  valueMap,
  value,
  onValueChange,
}: FacetSelectProps): React.JSX.Element | null {
  const {
    data: facets,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["facets", field],
    queryFn: () => fetchFacets(field),
    staleTime: Infinity,
  });

  if (isError) {
    return null;
  }

  const options = (facets ?? []).map((f) => {
    const key = valueMap?.[f.value] ?? f.value;
    return { value: key, label: `${labelMap[key] ?? key} (${f.count})` };
  });

  return (
    <label className={styles.label}>
      {label}
      <Select value={value} onValueChange={onValueChange} options={options} disabled={isLoading} />
    </label>
  );
}
