import { Field as BaseField } from "@base-ui/react/field";
import clsx from "clsx";
import React from "react";
import { Input } from "../Input/Input";
import styles from "./Field.module.css";

interface FieldBase {
  label: string;
  className?: string;
}

interface FieldProps extends FieldBase {
  /** Custom control (combobox, select wrapper, etc.). When omitted, renders a default Input. */
  children?: React.ReactElement;
  /** Props forwarded to the default Input. Only used when `children` is not provided. */
  inputProps?: React.ComponentPropsWithRef<"input">;
}

export function Field({ label, children, inputProps, className }: FieldProps): React.JSX.Element {
  return (
    <BaseField.Root className={clsx(styles.root, className)}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      {children != null ? (
        <BaseField.Control render={children} />
      ) : (
        <BaseField.Control render={<Input {...inputProps} />} />
      )}
    </BaseField.Root>
  );
}

function SubField({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}): React.JSX.Element {
  return (
    <BaseField.Root>
      <BaseField.Label className={styles.rangeFieldLabel}>{label}</BaseField.Label>
      <BaseField.Control render={children} />
    </BaseField.Root>
  );
}

interface RangeFieldProps extends FieldBase {
  children: [React.ReactElement, React.ReactElement];
  stack?: boolean;
}

export function RangeField({
  label,
  children,
  className,
  stack,
}: RangeFieldProps): React.JSX.Element {
  const [fromInput, toInput] = children;
  return (
    <fieldset className={clsx(styles.root, styles.rangeFieldset, className)}>
      <legend className={styles.label}>{label}</legend>
      <div className={clsx(styles.rangeFields, stack && styles.rangeFieldsStacked)}>
        <SubField label="from">{fromInput}</SubField>
        <SubField label="to">{toInput}</SubField>
      </div>
    </fieldset>
  );
}
