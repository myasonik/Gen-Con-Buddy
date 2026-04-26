import { useState, useEffect } from 'react'
import type { ColumnSizingState, OnChangeFn } from '@tanstack/react-table'

const STORAGE_KEY = 'gcb-column-sizing'
const VERSION = 1

function readFromStorage(): ColumnSizingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== VERSION
    ) {
      return {}
    }
    return (parsed as { version: number; sizing: ColumnSizingState }).sizing
  } catch {
    return {}
  }
}

export function useColumnSizing(): {
  sizing: ColumnSizingState
  setSizing: OnChangeFn<ColumnSizingState>
  reset: () => void
} {
  const [sizingState, setSizingState] = useState<ColumnSizingState>(readFromStorage)

  useEffect(() => {
    if (Object.keys(sizingState).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, sizing: sizingState }))
    }
  }, [sizingState])

  const setSizing: OnChangeFn<ColumnSizingState> = (updaterOrValue): void => {
    setSizingState((prev) =>
      typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue,
    )
  }

  const reset = (): void => {
    setSizingState({})
  }

  return { sizing: sizingState, setSizing, reset }
}
