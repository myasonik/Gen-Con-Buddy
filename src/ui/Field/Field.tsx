import { Field as BaseField } from "@base-ui/react/field";
import clsx from "clsx";
import React from "react";
import styles from "./Field.module.css";

interface FieldBase {
  label: string;
  className?: string;
}

interface FieldProps extends FieldBase {
  children: React.ReactElement;
}

export function Field({ label, children, className }: FieldProps): React.JSX.Element {
  return (
    <BaseField.Root className={clsx(styles.root, className)}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      <BaseField.Control render={children} />
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
