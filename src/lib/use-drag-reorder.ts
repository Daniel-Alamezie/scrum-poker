'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** How far the pointer has to move before a press becomes a drag, so taps still work. */
const DRAG_THRESHOLD_PX = 5
const SLIDE_MS = 220
const SETTLE_MS = 180
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
const LIFTED = 'scale(1.08) rotate(3deg)'

interface DragState {
  key: string
  pointerId: number
  startX: number
  startY: number
  /** Where inside the card it was grabbed, so it doesn't jump to the pointer. */
  grabX: number
  grabY: number
  clientX: number
  clientY: number
  active: boolean
}

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Drag-and-drop reordering for a wrapping row of items, with mouse or touch.
 *
 * The picked-up item follows the pointer. As it passes another slot the list
 * is reordered straight away, and every other item slides from where it was
 * to where it now sits (FLIP: measure, reorder, invert, play). On release the
 * dragged item settles into its slot. The same slide runs for any change
 * announced with `animateNextChange`, such as the move buttons or a removal.
 *
 * Window listeners are used instead of pointer capture because React moves
 * DOM nodes when it reorders keyed children, which would drop the capture.
 */
export function useDragReorder(items: readonly string[], onReorder: (next: string[]) => void) {
  const listRef = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLElement>())
  const before = useRef(new Map<string, DOMRect>())
  const drag = useRef<DragState | null>(null)
  const justDragged = useRef(false)
  const latest = useRef({ items, onReorder })
  latest.current = { items, onReorder }
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  /** Records where every item is on screen now, so the next render can slide from there. */
  const animateNextChange = useCallback(() => {
    before.current.clear()
    for (const [key, el] of elements.current) before.current.set(key, el.getBoundingClientRect())
  }, [])

  /** Keeps the dragged item under the pointer, measured from its slot in the layout. */
  const followPointer = useCallback(() => {
    const d = drag.current
    const list = listRef.current
    const el = d && elements.current.get(d.key)
    if (!d || !d.active || !list || !el) return
    const listBox = list.getBoundingClientRect()
    const x = d.clientX - d.grabX - listBox.left - el.offsetLeft
    const y = d.clientY - d.grabY - listBox.top - el.offsetTop
    el.style.transform = `translate(${x}px, ${y}px) ${LIFTED}`
  }, [])

  // After each reorder: slide everything except the dragged item from its old spot.
  useLayoutEffect(() => {
    const previous = before.current
    if (previous.size > 0) {
      const slide = !reducedMotion()
      for (const [key, el] of elements.current) {
        if (key === drag.current?.key && drag.current.active) continue
        const from = previous.get(key)
        if (!from) continue
        el.getAnimations().forEach(a => a.cancel())
        const to = el.getBoundingClientRect()
        const dx = from.left - to.left
        const dy = from.top - to.top
        if (slide && (dx !== 0 || dy !== 0)) {
          el.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
            { duration: SLIDE_MS, easing: EASING }
          )
        }
      }
      previous.clear()
    }
    followPointer()
  }, [items, followPointer])

  const onMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current
      if (!d || e.pointerId !== d.pointerId) return
      d.clientX = e.clientX
      d.clientY = e.clientY

      if (!d.active) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX) return
        d.active = true
        setDraggingKey(d.key)
      }
      e.preventDefault()
      followPointer()

      // The slot whose layout centre is nearest the pointer is where the card belongs.
      const list = listRef.current
      if (!list) return
      const listBox = list.getBoundingClientRect()
      const { items: current, onReorder: reorder } = latest.current
      let target = -1
      let best = Infinity
      current.forEach((key, i) => {
        const el = elements.current.get(key)
        if (!el) return
        const cx = listBox.left + el.offsetLeft + el.offsetWidth / 2
        const cy = listBox.top + el.offsetTop + el.offsetHeight / 2
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
        if (dist < best) {
          best = dist
          target = i
        }
      })
      const from = current.indexOf(d.key)
      if (target === -1 || from === -1 || target === from) return

      const next = [...current]
      next.splice(from, 1)
      next.splice(target, 0, d.key)
      animateNextChange()
      reorder(next)
    },
    [animateNextChange, followPointer]
  )

  const onUp = useCallback(
    (e: PointerEvent) => {
      const d = drag.current
      if (!d || e.pointerId !== d.pointerId) return
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      drag.current = null
      if (!d.active) return

      // The release often lands outside the card, which the browser reports as a
      // click on the dialog backdrop. Swallow that one click.
      justDragged.current = true
      setTimeout(() => (justDragged.current = false), 0)
      setDraggingKey(null)

      const el = elements.current.get(d.key)
      if (!el) return
      const lifted = el.style.transform
      el.style.transform = ''
      if (!reducedMotion() && lifted) {
        el.animate([{ transform: lifted }, { transform: 'translate(0, 0)' }], {
          duration: SETTLE_MS,
          easing: EASING,
        })
      }
    },
    [onMove]
  )

  // Never leave window listeners behind if the dialog unmounts mid-drag.
  useEffect(
    () => () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    },
    [onMove, onUp]
  )

  /** Props for each draggable item. Presses on buttons inside it are left alone. */
  const itemProps = (key: string) => ({
    ref: (el: HTMLElement | null) => {
      if (el) elements.current.set(key, el)
      else elements.current.delete(key)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || (e.target as Element).closest('button')) return
      const el = elements.current.get(key)
      const list = listRef.current
      if (!el || !list) return
      const listBox = list.getBoundingClientRect()
      drag.current = {
        key,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        grabX: e.clientX - listBox.left - el.offsetLeft,
        grabY: e.clientY - listBox.top - el.offsetTop,
        clientX: e.clientX,
        clientY: e.clientY,
        active: false,
      }
      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
  })

  return {
    listRef,
    itemProps,
    draggingKey,
    animateNextChange,
    /** True for the click that ends a drag, so it isn't treated as a backdrop click. */
    wasJustDragged: () => justDragged.current,
  }
}
