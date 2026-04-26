import { createFileRoute } from '@tanstack/react-router'
import { EventDetail } from '../components/EventDetail/EventDetail'

export const Route = createFileRoute('/event/$id')({
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
