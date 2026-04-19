import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
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
import * as announceModule from '../../lib/announce'
import { __reset } from '../../lib/announce'

beforeEach(() => {
  localStorage.clear()
})

beforeEach(() => {
  __reset()
  vi.restoreAllMocks()
})

function renderSearchResults(
  searchParams: SearchParams = {},
  onNavigate = vi.fn(),
  onSort = vi.fn(),
) {
  const rootRoute = createRootRoute({
    component: () => (
      <SearchResults searchParams={searchParams} onNavigate={onNavigate} onSort={onSort} />
    ),
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

test('materialsRequired column is hidden by default', async () => {
  renderSearchResults()
  await screen.findAllByRole('row')
  expect(screen.queryByRole('columnheader', { name: 'Materials Required' })).not.toBeInTheDocument()
})

test('materialsRequiredDetails column is hidden by default', async () => {
  renderSearchResults()
  await screen.findAllByRole('row')
  expect(screen.queryByRole('columnheader', { name: 'Materials Required Details' })).not.toBeInTheDocument()
})

test('sends page as 0-indexed when page > 1', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ page: 2 })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.get('page')).toBe('1')
})

test('omits page param when page is 1', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ page: 1 })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.has('page')).toBe(false)
})

test('omits limit param when limit is 100', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ limit: 100 })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.has('limit')).toBe(false)
})

test('sends limit param when limit is not 100', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ limit: 500 })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.get('limit')).toBe('500')
})

test('renders pagination when results are present', async () => {
  renderSearchResults()
  const navs = await screen.findAllByRole('navigation', { name: 'Pagination' })
  expect(navs.length).toBeGreaterThan(0)
})

test('renders pagination above and below the table', async () => {
  renderSearchResults()
  await screen.findAllByRole('row')
  const navs = screen.getAllByRole('navigation', { name: 'Pagination' })
  expect(navs).toHaveLength(2)
})

test('does not render pagination when no events found', async () => {
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
  await screen.findByText('No events found.')
  expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
})

test('calls onNavigate when Next is clicked', async () => {
  const user = userEvent.setup()
  const onNavigate = vi.fn()
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ page: 1 }, onNavigate)
  // wait for both pagination navs to render
  await screen.findAllByRole('navigation', { name: 'Pagination' })
  await user.click(screen.getAllByRole('button', { name: 'Next' })[0])
  expect(onNavigate).toHaveBeenCalledWith(2, 100)
})

test('sends sort param to API when provided in searchParams', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ sort: 'startDateTime.asc' })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.get('sort')).toBe('startDateTime.asc')
})

test('omits sort param from API when not in searchParams', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({})
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.has('sort')).toBe(false)
})

test('unsorted sortable column has aria-sort="none"', async () => {
  renderSearchResults({})
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'none')
})

test('active ascending column has aria-sort="ascending"', async () => {
  renderSearchResults({ sort: 'title.asc' })
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'ascending')
})

test('active descending column has aria-sort="descending"', async () => {
  renderSearchResults({ sort: 'title.desc' })
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'descending')
})

test('clicking unsorted column calls onSort with field.asc', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({}, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith('title.asc')
})

test('clicking ascending column calls onSort with field.desc', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({ sort: 'title.asc' }, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith('title.desc')
})

test('clicking descending column calls onSort with undefined (clears sort)', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({ sort: 'title.desc' }, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith(undefined)
})

test('day column has aria-sort="ascending" when sorted by startDateTime ascending', async () => {
  renderSearchResults({ sort: 'startDateTime.asc' })
  const th = await screen.findByRole('columnheader', { name: 'Day' })
  expect(th).toHaveAttribute('aria-sort', 'ascending')
})

test('announces "Sorted by Title, ascending" when clicking unsorted column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({}, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sorted by Title, ascending')
})

test('announces "Sorted by Title, descending" when clicking ascending column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({ sort: 'title.asc' }, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sorted by Title, descending')
})

test('announces "Sort cleared" when clicking descending column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({ sort: 'title.desc' }, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sort cleared')
})
