import clsx from "clsx";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Any",
  className,
  "aria-label": ariaLabel,
}: SelectProps): JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={clsx(styles.select, className)}
      aria-label={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {options.map(({ value: v, label }) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
