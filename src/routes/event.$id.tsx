import { createFileRoute } from '@tanstack/react-router'
import { fetchEvents } from '../utils/api'
import { queryClient } from '../lib/queryClient'
import { EventDetail } from '../components/EventDetail/EventDetail'

export const Route = createFileRoute('/event/$id')({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['event', params.id],
      queryFn: () => fetchEvents({ gameId: params.id, limit: 1 }),
    })
  },
  component: EventDetailPage,
})

function EventDetailPage(): JSX.Element {
  const { id } = Route.useParams()
  return (
    <main>
      <EventDetail gameId={id} />
    </main>
  )
}
