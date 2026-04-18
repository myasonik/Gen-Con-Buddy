import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from './SearchForm'
import type { SearchFormValues } from '../../utils/types'

const noop = () => undefined

test('renders the top-level filter and event type fields', () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />)
  expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toBeInTheDocument()
})

test('renders the Search and Reset buttons', () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />)
  expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
})

test('renders advanced filter fields inside a disclosure', () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />)
  expect(screen.getByRole('textbox', { name: 'Title' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Game ID' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Location' })).toBeInTheDocument()
})

test('populates fields from defaultValues', () => {
  render(<SearchForm defaultValues={{ title: 'Dungeon Crawl' }} onSearch={noop} />)
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Dungeon Crawl')
})

test('submits with the title value passed to onSearch', async () => {
  const user = userEvent.setup()
  const handleSearch = vi.fn<[SearchFormValues], void>()
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />)

  await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Dragons')
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(handleSearch).toHaveBeenCalledOnce()
  expect(handleSearch.mock.calls[0][0]).toMatchObject({ title: 'Dragons' })
})

test('submits with the filter (full text search) value', async () => {
  const user = userEvent.setup()
  const handleSearch = vi.fn<[SearchFormValues], void>()
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />)

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'fire')
  await user.click(screen.getByRole('button', { name: 'Search' }))

  expect(handleSearch.mock.calls[0][0]).toMatchObject({ filter: 'fire' })
})

test('Reset button clears all form fields', async () => {
  const user = userEvent.setup()
  render(<SearchForm defaultValues={{ title: 'Dungeon Crawl', filter: 'dragon' }} onSearch={noop} />)

  await user.click(screen.getByRole('button', { name: 'Reset' }))

  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('')
  expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('')
})

test('picks up new defaultValues when re-mounted with a new key', () => {
  const { rerender } = render(
    <SearchForm key="a" defaultValues={{ eventType: 'BGM' }} onSearch={noop} />
  )
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')

  rerender(<SearchForm key="b" defaultValues={{ eventType: 'RPG' }} onSearch={noop} />)

  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('RPG')
})
