// Pin to Gen Con's host city — all date display (day names, times) is relative to Indianapolis time
process.env.TZ = 'America/Indianapolis'

import '@testing-library/jest-dom'
import { server } from './msw/server'

window.scrollTo = () => {}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
