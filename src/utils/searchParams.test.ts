import { buildSearchParams, parseSearchParams } from './searchParams'

describe('buildSearchParams', () => {
  it('omits empty/undefined fields', () => {
    const result = buildSearchParams({ title: '' })
    expect(result).not.toHaveProperty('title')
  })

  it('includes non-empty text fields', () => {
    const result = buildSearchParams({ title: 'Dungeons' })
    expect(result.title).toBe('Dungeons')
  })

  it('always sets limit to 500', () => {
    const result = buildSearchParams({})
    expect(result.limit).toBe(500)
  })

  it('encodes a numeric range as "[min,max]"', () => {
    const result = buildSearchParams({ minPlayersMin: '2', minPlayersMax: '6' })
    expect(result.minPlayers).toBe('[2,6]')
  })

  it('encodes a partial range with empty side', () => {
    const result = buildSearchParams({ minPlayersMin: '2', minPlayersMax: '' })
    expect(result.minPlayers).toBe('[2,]')
  })

  it('omits range when both sides are empty', () => {
    const result = buildSearchParams({ minPlayersMin: '', minPlayersMax: '' })
    expect(result).not.toHaveProperty('minPlayers')
  })

  it('encodes a date range appending :00Z to each side', () => {
    const result = buildSearchParams({
      startDateTimeStart: '2024-08-01T10:00',
      startDateTimeEnd: '2024-08-01T14:00',
    })
    expect(result.startDateTime).toBe('[2024-08-01T10:00:00Z,2024-08-01T14:00:00Z]')
  })

  it('encodes a partial date range', () => {
    const result = buildSearchParams({ startDateTimeStart: '2024-08-01T10:00', startDateTimeEnd: '' })
    expect(result.startDateTime).toBe('[2024-08-01T10:00:00Z,]')
  })

  it('encodes boolean true as "true"', () => {
    const result = buildSearchParams({ materialsProvided: true })
    expect(result.materialsProvided).toBe('true')
  })

  it('omits boolean false', () => {
    const result = buildSearchParams({ materialsProvided: false })
    expect(result).not.toHaveProperty('materialsProvided')
  })
})

describe('parseSearchParams', () => {
  it('returns empty object from empty params', () => {
    const result = parseSearchParams({})
    expect(result.title).toBeUndefined()
    expect(result.minPlayersMin).toBeUndefined()
  })

  it('passes through text fields unchanged', () => {
    const result = parseSearchParams({ title: 'Dungeons' })
    expect(result.title).toBe('Dungeons')
  })

  it('splits a numeric range "[2,6]" into min and max', () => {
    const result = parseSearchParams({ minPlayers: '[2,6]' })
    expect(result.minPlayersMin).toBe('2')
    expect(result.minPlayersMax).toBe('6')
  })

  it('handles a partial range "[2,]"', () => {
    const result = parseSearchParams({ minPlayers: '[2,]' })
    expect(result.minPlayersMin).toBe('2')
    expect(result.minPlayersMax).toBe('')
  })

  it('strips :00Z from date range values', () => {
    const result = parseSearchParams({
      startDateTime: '[2024-08-01T10:00:00Z,2024-08-01T14:00:00Z]',
    })
    expect(result.startDateTimeStart).toBe('2024-08-01T10:00')
    expect(result.startDateTimeEnd).toBe('2024-08-01T14:00')
  })

  it('roundtrips: buildSearchParams then parseSearchParams returns original values', () => {
    const original = {
      title: 'Test',
      minPlayersMin: '2',
      minPlayersMax: '6',
      startDateTimeStart: '2024-08-01T10:00',
      startDateTimeEnd: '2024-08-01T14:00',
      materialsProvided: true as boolean | undefined,
    }
    const params = buildSearchParams(original)
    const parsed = parseSearchParams(params)
    expect(parsed.title).toBe('Test')
    expect(parsed.minPlayersMin).toBe('2')
    expect(parsed.minPlayersMax).toBe('6')
    expect(parsed.startDateTimeStart).toBe('2024-08-01T10:00')
    expect(parsed.startDateTimeEnd).toBe('2024-08-01T14:00')
  })
})
