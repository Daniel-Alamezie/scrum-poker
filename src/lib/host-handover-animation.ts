'use client'

/**
 * The "host handed over" moment: a crown lifts off the old host's badge,
 * arcs across to the new host's badge, lands with a bounce, and the new
 * host's row bursts into confetti.
 *
 * Everything is built with the Web Animations API on short-lived elements
 * appended to <body>, so it floats above the layout without shifting it and
 * cleans up after itself. People who prefer reduced motion get no animation.
 */

const CROWN_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z"/></svg>`

const CONFETTI_COLOURS = ['#f06c00', '#ffb000', '#7f0442', '#3d8a00', '#0c6fc0']
const CONFETTI_PIECES = 28
const FLIGHT_MS = 800

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

function centreOf(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function badgeSpotAfter(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect()
  return { x: r.right + 24, y: r.top + r.height / 2 }
}

function floating(): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    pointerEvents: 'none',
    zIndex: '1000',
  })
  document.body.appendChild(el)
  return el
}

function burstConfetti(origin: { x: number; y: number }, track: (el: HTMLElement) => void) {
  for (let i = 0; i < CONFETTI_PIECES; i++) {
    const piece = floating()
    const size = 5 + Math.random() * 4
    Object.assign(piece.style, {
      width: `${size}px`,
      height: `${size * (Math.random() > 0.5 ? 1 : 0.5)}px`,
      borderRadius: '1px',
      background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    })
    track(piece)

    const angle = Math.random() * Math.PI * 2
    const speed = 50 + Math.random() * 80
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const spin = (Math.random() - 0.5) * 900

    piece
      .animate(
        [
          { transform: `translate(${origin.x}px, ${origin.y}px) rotate(0deg)`, opacity: 1 },
          {
            transform: `translate(${origin.x + dx * 0.7}px, ${origin.y + dy * 0.7 - 20}px) rotate(${spin / 2}deg)`,
            opacity: 1,
            offset: 0.45,
          },
          {
            // Drift down a little as it fades, like it is falling.
            transform: `translate(${origin.x + dx}px, ${origin.y + dy + 60}px) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' }
      )
      .finished.then(() => piece.remove())
      .catch(() => piece.remove())
  }
}

/**
 * Plays the handover. `from` is the old host's name (the crown lifts off just
 * after it, where their badge used to be); null if they have left the room, in
 * which case the crown drops in from above the new host. `to` is the new
 * host's badge. Returns a cleanup that removes anything still on
 * screen, for use as a React effect cleanup.
 */
export function playHostHandover(from: Element | null, to: Element): () => void {
  if (prefersReducedMotion()) return () => {}

  const created: HTMLElement[] = []
  const track = (el: HTMLElement) => created.push(el)
  const end = centreOf(to)
  const start = from ? badgeSpotAfter(from) : { x: end.x, y: end.y - 80 }

  // Hide the real badge until the crown lands on it.
  const target = to as HTMLElement
  target.style.opacity = '0'

  const crown = floating()
  crown.innerHTML = CROWN_SVG
  crown.style.color = '#f06c00'
  crown.style.marginLeft = '-10px'
  crown.style.marginTop = '-10px'
  track(crown)

  // Arc: rise and grow on the way, settle back to size on landing.
  const midX = (start.x + end.x) / 2 + 40
  const midY = Math.min(start.y, end.y) - 40

  crown
    .animate(
      [
        { transform: `translate(${start.x}px, ${start.y}px) rotate(0deg) scale(1)` },
        { transform: `translate(${midX}px, ${midY}px) rotate(-20deg) scale(1.8)`, offset: 0.5 },
        { transform: `translate(${end.x}px, ${end.y}px) rotate(0deg) scale(1)` },
      ],
      { duration: FLIGHT_MS, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }
    )
    .finished.then(() => {
      crown.remove()
      target.style.opacity = ''
      target.animate(
        [{ transform: 'scale(0.3)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        {
          duration: 450,
          easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
        }
      )
      burstConfetti(end, track)
    })
    .catch(() => {
      target.style.opacity = ''
    })

  return () => {
    target.style.opacity = ''
    created.forEach(el => el.remove())
  }
}
