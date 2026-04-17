import { http, HttpResponse } from 'msw'
import { makeEvent } from './factory'
import type { EventSearchResponse } from '../../utils/types'

export const handlers = [
  http.get('/api/events/search', () => {
    const response: EventSearchResponse = {
      data: [
        makeEvent({ gameId: 'RPG24000001', title: 'Test RPG Event' }),
        makeEvent({ gameId: 'BGM24000001', title: 'Test Board Game', eventType: 'BGM' }),
      ],
      meta: { total: 2 },
      links: { self: '/api/events/search' },
      error: null,
    }
    return HttpResponse.json(response)
  }),
]
