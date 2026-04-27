import React from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import clsx from 'clsx'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  children: React.ReactElement
  className?: string
}

export function Field({ label, children, className }: FieldProps): JSX.Element {
  return (
    <BaseField.Root className={clsx(styles.root, className)}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      <BaseField.Control render={children} />
    </BaseField.Root>
  )
}

interface RangeFieldProps {
  label: string
  children: [React.ReactElement, React.ReactElement]
  className?: string
}

export function RangeField({ label, children, className }: RangeFieldProps): JSX.Element {
  const [fromInput, toInput] = children
  return (
    <div className={clsx(styles.rangeRoot, className)}>
      <span className={styles.rangeLabel}>{label}</span>
      <div className={styles.rangeFields}>
        <BaseField.Root>
          <BaseField.Label className={styles.rangeFieldLabel}>from</BaseField.Label>
          <BaseField.Control render={fromInput} />
        </BaseField.Root>
        <BaseField.Root>
          <BaseField.Label className={styles.rangeFieldLabel}>to</BaseField.Label>
          <BaseField.Control render={toInput} />
        </BaseField.Root>
      </div>
    </div>
  )
}
