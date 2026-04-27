import { StrictMode } from 'react'
import { expect, test } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../test/msw/server'
import { makeEvent } from '../test/msw/factory'
import { routeTree } from '../routeTree.gen'
import type { EventSearchResponse } from '../utils/types'

// oxlint-disable-next-line typescript/explicit-function-return-type
async function renderEventDetailPage(gameId: string) {
  const history = createMemoryHistory({ initialEntries: [`/event/${gameId}`] })
  const router = createRouter({ routeTree, history })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await router.load()
  await act(async () => {
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    )
  })
  return router
}

test('renders event detail page inside a main landmark', async () => {
  await renderEventDetailPage('RPG24000042')
  expect(screen.getByRole('main')).toBeInTheDocument()
})

test('passes the route param gameId to the API', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: 'BGM24000099' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderEventDetailPage('BGM24000099')
  await screen.findAllByRole('term')
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(capturedUrl!.searchParams.get('gameId')).toBe('BGM24000099')
})

test('renders the event title from the URL gameId param', async () => {
  server.use(
    http.get('/api/events/search', ({ request }) => {
      const url = new URL(request.url)
      const gameId = url.searchParams.get('gameId') ?? ''
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: 'Dungeon Crawl Classic' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderEventDetailPage('RPG24000042')
  await expect(screen.findByText('Dungeon Crawl Classic')).resolves.toBeInTheDocument()
})

test('has exactly one h1 on the event detail page', async () => {
  server.use(
    http.get('/api/events/search', ({ request }) => {
      const url = new URL(request.url)
      const gameId = url.searchParams.get('gameId') ?? ''
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: 'Only Heading Here' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderEventDetailPage('RPG24000001')
  await screen.findByText('Only Heading Here')
  expect(document.querySelectorAll('h1')).toHaveLength(1)
})
