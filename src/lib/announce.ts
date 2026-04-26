export type Priority = 'polite' | 'assertive'

const nodeId: Record<Priority, string> = {
  polite: 'live-polite',
  assertive: 'live-assertive',
}

let busy = false
const queue: Array<{ message: string; priority: Priority }> = []

function drainQueue() {
  if (queue.length === 0) {
    busy = false
    return
  }
  busy = true
  const { message, priority } = queue.shift()!
  const node = document.getElementById(nodeId[priority])
  if (!node) {
    drainQueue()
    return
  }
  node.textContent = ''
  setTimeout(() => {
    node.textContent = message
    setTimeout(drainQueue, 150)
  }, 0)
}

export function announce(message: string, priority: Priority = 'polite'): void {
  queue.push({ message, priority })
  if (!busy) drainQueue()
}

// Test-only: resets internal queue/busy state between test runs.
// Guarded so it is a no-op (and throws) in production bundles.
export function __reset(): void {
  if (import.meta.env.PROD) {
    throw new Error('__reset is a test-only helper and must not be called in production')
  }
  busy = false
  queue.length = 0
}
