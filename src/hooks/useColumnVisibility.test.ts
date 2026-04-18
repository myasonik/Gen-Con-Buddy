import { renderHook, act } from '@testing-library/react'
import { useColumnVisibility } from './useColumnVisibility'

const STORAGE_KEY = 'gen-con-buddy-columns'

beforeEach(() => {
  localStorage.clear()
})

test('returns correct defaults on first use', () => {
  const { result } = renderHook(() => useColumnVisibility())
  expect(result.current.visibility.title).toBe(true)
  expect(result.current.visibility.shortDescription).toBe(true)
  expect(result.current.visibility.minPlayers).toBe(true)
  expect(result.current.visibility.maxPlayers).toBe(true)
  expect(result.current.visibility.day).toBe(true)
  expect(result.current.visibility.startDateTime).toBe(true)
  expect(result.current.visibility.endDateTime).toBe(true)
  expect(result.current.visibility.ticketsAvailable).toBe(true)
  expect(result.current.visibility.gameId).toBe(false)
  expect(result.current.visibility.longDescription).toBe(false)
  expect(result.current.visibility.materialsRequired).toBe(false)
  expect(result.current.visibility.materialsRequiredDetails).toBe(false)
})

test('toggle flips a column from true to false', () => {
  const { result } = renderHook(() => useColumnVisibility())
  expect(result.current.visibility.title).toBe(true)

  act(() => {
    result.current.toggle('title')
  })

  expect(result.current.visibility.title).toBe(false)
})

test('persists visibility state to localStorage', () => {
  const { result } = renderHook(() => useColumnVisibility())

  act(() => {
    result.current.toggle('title')
  })

  const { result: result2 } = renderHook(() => useColumnVisibility())
  expect(result2.current.visibility.title).toBe(false)
})

test('resets to defaults when stored version does not match', () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 9999, visibility: { title: false } }),
  )

  const { result } = renderHook(() => useColumnVisibility())
  expect(result.current.visibility.title).toBe(true)
})

test('resets to defaults when stored data is malformed', () => {
  localStorage.setItem(STORAGE_KEY, 'not-json{{{')

  const { result } = renderHook(() => useColumnVisibility())
  expect(result.current.visibility.title).toBe(true)
})

test('reset restores all columns to defaults after toggling', () => {
  const { result } = renderHook(() => useColumnVisibility())

  act(() => {
    result.current.toggle('title')      // title: true → false
    result.current.toggle('gameId')     // gameId: false → true
  })

  expect(result.current.visibility.title).toBe(false)
  expect(result.current.visibility.gameId).toBe(true)

  act(() => {
    result.current.reset()
  })

  expect(result.current.visibility.title).toBe(true)
  expect(result.current.visibility.gameId).toBe(false)
})
