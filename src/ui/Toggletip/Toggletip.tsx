import { useRef } from 'react'
import { Popover } from '@base-ui/react/popover'
import styles from './Toggletip.module.css'

interface ToggletipProps {
  label: string
  message: string
}

export function Toggletip({ label, message }: ToggletipProps): JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null)

  return (
    <span ref={containerRef}>
      <Popover.Root>
        <Popover.Trigger aria-label={label} className={styles.button}>
          ?
        </Popover.Trigger>
        <Popover.Portal container={containerRef}>
          <Popover.Positioner sideOffset={4} positionMethod="fixed">
            <Popover.Popup className={styles.tooltip}>{message}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  )
}
