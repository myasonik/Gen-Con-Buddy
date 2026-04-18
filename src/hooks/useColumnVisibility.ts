import { useState, useEffect } from 'react'

const STORAGE_KEY = 'gen-con-buddy-columns'
const VERSION = 1

const DEFAULTS: Record<string, boolean> = {
  gameId: false,
  title: true,
  eventType: false,
  group: false,
  shortDescription: true,
  longDescription: false,
  gameSystem: false,
  rulesEdition: false,
  minPlayers: true,
  maxPlayers: true,
  ageRequired: false,
  experienceRequired: false,
  materialsProvided: false,
  materialsRequired: false,
  materialsRequiredDetails: false,
  day: true,
  startDateTime: true,
  duration: false,
  endDateTime: true,
  gmNames: false,
  website: false,
  email: false,
  tournament: false,
  roundNumber: false,
  totalRounds: false,
  minimumPlayTime: false,
  attendeeRegistration: false,
  cost: false,
  location: false,
  roomName: false,
  tableNumber: false,
  specialCategory: false,
  ticketsAvailable: true,
  lastModified: false,
}

function readFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== VERSION
    ) {
      return { ...DEFAULTS }
    }
    return (parsed as { version: number; visibility: Record<string, boolean> }).visibility
  } catch {
    return { ...DEFAULTS }
  }
}

export function useColumnVisibility() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(readFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, visibility }))
  }, [visibility])

  const toggle = (column: string) => {
    setVisibility((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const reset = () => {
    setVisibility({ ...DEFAULTS })
  }

  return { visibility, toggle, reset }
}
