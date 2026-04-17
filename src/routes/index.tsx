import { createFileRoute } from '@tanstack/react-router'
import type { SearchParams } from '../utils/types'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (k: string) =>
      typeof search[k] === 'string' ? (search[k] as string) : undefined
    const num = (k: string) =>
      typeof search[k] === 'number' ? (search[k] as number) : undefined
    return {
      limit: num('limit'),
      filter: str('filter'),
      gameId: str('gameId'),
      title: str('title'),
      eventType: str('eventType'),
      group: str('group'),
      shortDescription: str('shortDescription'),
      longDescription: str('longDescription'),
      gameSystem: str('gameSystem'),
      rulesEdition: str('rulesEdition'),
      minPlayers: str('minPlayers'),
      maxPlayers: str('maxPlayers'),
      ageRequired: str('ageRequired'),
      experienceRequired: str('experienceRequired'),
      materialsProvided: str('materialsProvided'),
      startDateTime: str('startDateTime'),
      duration: str('duration'),
      endDateTime: str('endDateTime'),
      gmNames: str('gmNames'),
      website: str('website'),
      email: str('email'),
      tournament: str('tournament'),
      roundNumber: str('roundNumber'),
      totalRounds: str('totalRounds'),
      minimumPlayTime: str('minimumPlayTime'),
      attendeeRegistration: str('attendeeRegistration'),
      cost: str('cost'),
      location: str('location'),
      roomName: str('roomName'),
      tableNumber: str('tableNumber'),
      specialCategory: str('specialCategory'),
      ticketsAvailable: str('ticketsAvailable'),
      lastModified: str('lastModified'),
    }
  },
  component: () => <main><p>Search coming soon.</p></main>,
})
