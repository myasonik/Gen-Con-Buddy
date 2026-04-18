import { daysToStartDateTime } from './searchParams'
import { EVENT_TYPES } from './enums'
import type { EventSearchResponse, SearchParams } from './types'

export async function fetchEvents(params: SearchParams): Promise<EventSearchResponse> {
  const url = new URL('/api/events/search', window.location.origin)
  if (params.days) {
    const startDateTime = daysToStartDateTime(params.days)
    if (startDateTime) url.searchParams.set('startDateTime', startDateTime)
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    if (key === 'days') return
    if (key === 'eventType' && typeof value === 'string') {
      url.searchParams.set(key, EVENT_TYPES[value] ?? value)
    } else {
      url.searchParams.set(key, String(value))
    }
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<EventSearchResponse>
}
