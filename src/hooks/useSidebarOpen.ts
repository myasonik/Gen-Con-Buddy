import { useStoredState } from './useStoredState'

const STORAGE_KEY = 'sidebarOpen'
const VERSION = 1

export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useStoredState(STORAGE_KEY, VERSION, true)
  const toggle = (): void => setOpen((prev) => !prev)
  return [open, toggle]
}
