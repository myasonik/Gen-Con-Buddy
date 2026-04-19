import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useColumnVisibility } from '../../hooks/useColumnVisibility'
import { fetchEvents } from '../../utils/api'
import { Pagination } from '../Pagination/Pagination'
import type { SearchParams, Event } from '../../utils/types'

interface SearchResultsProps {
  searchParams: SearchParams
  onNavigate: (page: number, limit: number) => void
  onSort: (sort: string | undefined) => void
}

const COLUMNS = [
  { key: 'gameId', label: 'Game ID', sortField: 'gameId' },
  { key: 'title', label: 'Title', sortField: 'title' },
  { key: 'eventType', label: 'Type', sortField: 'eventType' },
  { key: 'group', label: 'Group', sortField: 'group' },
  { key: 'shortDescription', label: 'Short Description', sortField: 'shortDescription' },
  { key: 'longDescription', label: 'Long Description', sortField: 'longDescription' },
  { key: 'gameSystem', label: 'Game System', sortField: 'gameSystem' },
  { key: 'rulesEdition', label: 'Rules Edition', sortField: 'rulesEdition' },
  { key: 'minPlayers', label: 'Min Players', sortField: 'minPlayers' },
  { key: 'maxPlayers', label: 'Max Players', sortField: 'maxPlayers' },
  { key: 'ageRequired', label: 'Age Required', sortField: 'ageRequired' },
  { key: 'experienceRequired', label: 'Experience Required', sortField: 'experienceRequired' },
  { key: 'materialsProvided', label: 'Materials Provided', sortField: 'materialsProvided' },
  { key: 'materialsRequired', label: 'Materials Required', sortField: 'materialsRequired' },
  { key: 'materialsRequiredDetails', label: 'Materials Required Details', sortField: 'materialsRequiredDetails' },
  { key: 'day', label: 'Day', sortField: 'startDateTime' },
  { key: 'startDateTime', label: 'Start', sortField: 'startDateTime' },
  { key: 'duration', label: 'Duration', sortField: 'duration' },
  { key: 'endDateTime', label: 'End', sortField: 'endDateTime' },
  { key: 'gmNames', label: 'GMs', sortField: 'gmNames' },
  { key: 'website', label: 'Website', sortField: 'website' },
  { key: 'email', label: 'Email', sortField: 'email' },
  { key: 'tournament', label: 'Tournament', sortField: 'tournament' },
  { key: 'roundNumber', label: 'Round Number', sortField: 'roundNumber' },
  { key: 'totalRounds', label: 'Total Rounds', sortField: 'totalRounds' },
  { key: 'minimumPlayTime', label: 'Min Time', sortField: 'minimumPlayTime' },
  { key: 'attendeeRegistration', label: 'Attendee Registration', sortField: 'attendeeRegistration' },
  { key: 'cost', label: 'Cost', sortField: 'cost' },
  { key: 'location', label: 'Location', sortField: 'location' },
  { key: 'roomName', label: 'Room', sortField: 'roomName' },
  { key: 'tableNumber', label: 'Table Number', sortField: 'tableNumber' },
  { key: 'specialCategory', label: 'Special Category', sortField: 'specialCategory' },
  { key: 'ticketsAvailable', label: 'Tickets Available', sortField: 'ticketsAvailable' },
  { key: 'lastModified', label: 'Last Modified', sortField: 'lastModified' },
] as const

type ColumnKey = (typeof COLUMNS)[number]['key']

function EventCell({ col, event }: { col: ColumnKey; event: Event }) {
  const { attributes: a, attributes: { gameId } } = event
  const link = (text: React.ReactNode) => (
    <Link to="/event/$id" params={{ id: gameId }}>{text}</Link>
  )
  switch (col) {
    case 'gameId': return <td>{link(a.gameId)}</td>
    case 'title': return <td>{link(a.title)}</td>
    case 'eventType': return <td>{a.eventType}</td>
    case 'group': return <td>{a.group}</td>
    case 'shortDescription': return <td>{a.shortDescription}</td>
    case 'longDescription': return <td>{a.longDescription}</td>
    case 'gameSystem': return <td>{a.gameSystem}</td>
    case 'rulesEdition': return <td>{a.rulesEdition}</td>
    case 'minPlayers': return <td>{a.minPlayers}</td>
    case 'maxPlayers': return <td>{a.maxPlayers}</td>
    case 'ageRequired': return <td>{a.ageRequired}</td>
    case 'experienceRequired': return <td>{a.experienceRequired}</td>
    case 'materialsProvided': return <td>{a.materialsProvided}</td>
    case 'materialsRequired': return <td>{a.materialsRequired}</td>
    case 'materialsRequiredDetails': return <td>{a.materialsRequiredDetails}</td>
    case 'day': return <td>{format(new Date(a.startDateTime), 'EEEE')}</td>
    case 'startDateTime': return <td>{format(new Date(a.startDateTime), 'HH:mm')}</td>
    case 'duration': return <td>{a.duration}</td>
    case 'endDateTime': return <td>{format(new Date(a.endDateTime), 'HH:mm')}</td>
    case 'gmNames': return <td>{a.gmNames}</td>
    case 'website': return <td>{a.website}</td>
    case 'email': return <td>{a.email}</td>
    case 'tournament': return <td>{a.tournament}</td>
    case 'roundNumber': return <td>{a.roundNumber}</td>
    case 'totalRounds': return <td>{a.totalRounds}</td>
    case 'minimumPlayTime': return <td>{a.minimumPlayTime}</td>
    case 'attendeeRegistration': return <td>{a.attendeeRegistration}</td>
    case 'cost': return <td>${a.cost.toFixed(2)}</td>
    case 'location': return <td>{a.location}</td>
    case 'roomName': return <td>{a.roomName}</td>
    case 'tableNumber': return <td>{a.tableNumber}</td>
    case 'specialCategory': return <td>{a.specialCategory}</td>
    case 'ticketsAvailable': return <td>{a.ticketsAvailable}</td>
    case 'lastModified': return <td>{format(new Date(a.lastModified), 'yyyy-MM-dd')}</td>
  }
}

export function SearchResults({ searchParams, onNavigate, onSort }: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility()
  const page = searchParams.page ?? 1
  const limit = searchParams.limit ?? 100
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', searchParams],
    queryFn: () => fetchEvents(searchParams),
  })

  const [activeSortField, activeSortDir] = searchParams.sort
    ? searchParams.sort.split('.')
    : [undefined, undefined]

  const handleSortClick = (sortField: string) => {
    if (activeSortField !== sortField) {
      onSort(`${sortField}.asc`)
    } else if (activeSortDir === 'asc') {
      onSort(`${sortField}.desc`)
    } else {
      onSort(undefined)
    }
  }

  const visibleColumns = COLUMNS.filter((col) => visibility[col.key])

  const pagination = data && data.data.length > 0 ? (
    <Pagination
      page={page}
      limit={limit}
      total={data.meta.total}
      onNavigate={onNavigate}
    />
  ) : null

  return (
    <section>
      <details>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.key]}
                    onChange={() => toggle(col.key)}
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>Reset to defaults</button>
        </fieldset>
      </details>

      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading events.</p>}
      {data && data.data.length === 0 && <p>No events found.</p>}
      {data && data.data.length > 0 && (
        <>
          {pagination}
          <table>
            <thead>
              <tr>
                {visibleColumns.map((col) => {
                  const isActive = activeSortField === col.sortField
                  const ariaSort = isActive
                    ? activeSortDir === 'asc'
                      ? ('ascending' as const)
                      : ('descending' as const)
                    : ('none' as const)
                  return (
                    <th key={col.key} aria-sort={ariaSort} scope="col" aria-label={col.label}>
                      <button
                        type="button"
                        aria-label={`Sort by ${col.label}`}
                        onClick={() => handleSortClick(col.sortField)}
                      >
                        {col.label}
                        {isActive && (
                          <span aria-hidden="true">
                            {activeSortDir === 'asc' ? ' ▲' : ' ▼'}
                          </span>
                        )}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {data.data.map((event) => (
                <tr key={event.id}>
                  {visibleColumns.map((col) => (
                    <EventCell key={col.key} col={col.key} event={event} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination}
        </>
      )}
    </section>
  )
}
