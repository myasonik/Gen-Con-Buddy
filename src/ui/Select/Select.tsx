import { useRef } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import clsx from 'clsx'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Any',
  className,
  'aria-label': ariaLabel,
}: SelectProps): JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null)
  const items = [{ value: null, label: placeholder }, ...options]

  return (
    <span ref={containerRef}>
      <BaseSelect.Root
        value={value || null}
        onValueChange={(v) => onValueChange(v ?? '')}
        items={items}
      >
        <BaseSelect.Trigger className={clsx(styles.trigger, className)} aria-label={ariaLabel}>
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className={styles.icon}>▾</BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal container={containerRef}>
          <BaseSelect.Positioner positionMethod="fixed">
            <BaseSelect.Popup className={styles.popup}>
              <BaseSelect.Item value={null} className={styles.item}>
                <BaseSelect.ItemText>{placeholder}</BaseSelect.ItemText>
              </BaseSelect.Item>
              {options.map(({ value: v, label }) => (
                <BaseSelect.Item key={v} value={v} className={styles.item}>
                  <BaseSelect.ItemText>{label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </span>
  )
}
