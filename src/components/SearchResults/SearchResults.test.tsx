import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { makeEvent } from '../../test/msw/factory'
import { SearchResults } from './SearchResults'
import type { SearchParams, EventSearchResponse } from '../../utils/types'

beforeEach(() => {
  localStorage.clear()
})

function renderSearchResults(searchParams: SearchParams = {}) {
  const rootRoute = createRootRoute({
    component: () => <SearchResults searchParams={searchParams} />,
  })
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/event/$id',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

test('shows loading state while fetching', async () => {
  renderSearchResults()
  expect(await screen.findByText('Loading...')).toBeInTheDocument()
})

test('renders a table row for each event', async () => {
  renderSearchResults()
  const rows = await screen.findAllByRole('row')
  // 1 header row + 2 data rows (default handler returns 2 events)
  expect(rows).toHaveLength(3)
})

test('renders empty state when no events are returned', async () => {
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [],
        meta: { total: 0 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults()
  expect(await screen.findByText('No events found.')).toBeInTheDocument()
})

test('title column is visible by default and shows event title', async () => {
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: 'RPG24000001', title: 'My Favorite RPG' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults()
  expect(await screen.findByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'My Favorite RPG' })).toBeInTheDocument()
})

test('gameId column is hidden by default', async () => {
  renderSearchResults()
  await screen.findAllByRole('row')
  expect(screen.queryByRole('columnheader', { name: 'Game ID' })).not.toBeInTheDocument()
})

test('toggling a column off hides its header', async () => {
  const user = userEvent.setup()
  renderSearchResults()
  await screen.findAllByRole('row')

  const checkbox = screen.getByRole('checkbox', { name: 'Title' })
  await user.click(checkbox)

  expect(screen.queryByRole('columnheader', { name: 'Title' })).not.toBeInTheDocument()
})

test('event title link points to the event detail route', async () => {
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: 'RPG24000042', title: 'Dragon Hunt' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults()
  const link = await screen.findByRole('link', { name: 'Dragon Hunt' })
  expect(link).toHaveAttribute('href', '/event/RPG24000042')
})

test('reset button restores default column visibility', async () => {
  const user = userEvent.setup()
  renderSearchResults()
  await screen.findAllByRole('row')

  // gameId is hidden by default — toggle it on
  const checkbox = screen.getByRole('checkbox', { name: 'Game ID' })
  await user.click(checkbox)
  expect(screen.getByRole('columnheader', { name: 'Game ID' })).toBeInTheDocument()

  // click reset — gameId should disappear again
  await user.click(screen.getByRole('button', { name: 'Reset to defaults' }))
  expect(screen.queryByRole('columnheader', { name: 'Game ID' })).not.toBeInTheDocument()

  // title (default-visible) should still be present
  expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
})
