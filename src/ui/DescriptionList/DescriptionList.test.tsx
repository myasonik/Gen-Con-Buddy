import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DescriptionList, DescriptionItem } from './DescriptionList'
import styles from './DescriptionList.module.css'

test('renders a dl element', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  )
  expect(screen.getByRole('term')).toBeInTheDocument()
  expect(screen.getByRole('definition')).toBeInTheDocument()
})

test('DescriptionItem renders term and value', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  )
  expect(screen.getByRole('term')).toHaveTextContent('Label')
  expect(screen.getByRole('definition')).toHaveTextContent('Value')
})

test('DescriptionItem with span="full" has full class', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label" span="full">Value</DescriptionItem>
    </DescriptionList>,
  )
  const dl = screen.getByRole('term').closest('dl')
  expect(dl?.firstElementChild?.classList).toContain(styles.full)
})

test('DescriptionItem without span="full" does not have full class', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  )
  const dl = screen.getByRole('term').closest('dl')
  expect(dl?.firstElementChild?.classList).not.toContain(styles.full)
})
