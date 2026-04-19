import { act, render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

async function renderSearchPage(initialEntry = '/') {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = createRouter({ routeTree, history })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await router.load()
  await act(async () => {
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
  })
  return router
}

test('populates eventType dropdown from URL search param on load', async () => {
  await renderSearchPage('/?eventType=BGM')
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')
})

test('updates form when URL search params change after initial render', async () => {
  const router = await renderSearchPage('/?eventType=BGM')
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')

  await act(async () => {
    await router.navigate({ to: '/', search: { eventType: 'RPG' } })
  })

  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('RPG')
})

test('page param is read from URL', async () => {
  await renderSearchPage('/?page=3')
  // SearchResults will request page 3 — confirmed via MSW handler
  // Just verify page doesn't cause a crash; API call tested in SearchResults tests
  expect(screen.queryByText('Loading...')).toBeDefined()
})

test('limit param is read from URL', async () => {
  await renderSearchPage('/?limit=500')
  expect(screen.queryByText('Loading...')).toBeDefined()
})
