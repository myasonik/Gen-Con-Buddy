import type { EventSearchResponse, SearchParams } from './types'

export async function fetchEvents(params: SearchParams): Promise<EventSearchResponse> {
  const url = new URL('/api/events/search', window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<EventSearchResponse>
}
