import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

test('renders the placeholder when no value is selected', () => {
  render(
    <Select value="" onValueChange={() => undefined} options={OPTIONS} placeholder="Any" />,
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('Any')
})

test('shows the selected option label', () => {
  render(
    <Select value="a" onValueChange={() => undefined} options={OPTIONS} />,
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('Alpha')
})
