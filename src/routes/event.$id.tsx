import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/event/$id')({
  component: () => {
    const { id } = Route.useParams()
    return <main><p>Event {id} coming soon.</p></main>
  },
})
