import { createFileRoute } from '@tanstack/react-router'
import { SearchForm } from '../components/SearchForm/SearchForm'
import { SearchResults } from '../components/SearchResults/SearchResults'
import { buildSearchParams, parseSearchParams } from '../utils/searchParams'
import type { SearchFormValues, SearchParams } from '../utils/types'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (k: string) =>
      typeof search[k] === 'string' ? (search[k] as string) : undefined
    const num = (k: string) =>
      typeof search[k] === 'number' ? (search[k] as number) : undefined
    return {
      limit: num('limit'),
      page: num('page'),
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
      days: str('days'),
    }
  },
  component: SearchPage,
})

function SearchPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const handleSearch = (values: SearchFormValues) => {
    // Preserve limit across filter changes; page resets to 1 by omission
    const params = buildSearchParams(values)
    if (search.limit !== undefined) params.limit = search.limit
    void navigate({ search: params })
  }

  const handleNavigate = (page: number, limit: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
        limit: limit === 100 ? undefined : limit,
      }),
    })
  }

  return (
    <main>
      <h1>Gen Con Buddy</h1>
      <SearchForm key={JSON.stringify(search)} defaultValues={parseSearchParams(search)} onSearch={handleSearch} />
      <SearchResults searchParams={search} onNavigate={handleNavigate} />
    </main>
  )
}
