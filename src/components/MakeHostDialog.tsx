'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

interface MakeHostDialogProps {
  /** The participant being offered the host role. The dialog is open while this is set. */
  target: { id: string; name: string } | null
  onConfirm: (participantId: string) => void
  onCancel: () => void
}

/**
 * Confirms handing the host role to someone else. Built on the native
 * <dialog> element so focus is trapped and Escape closes it for free; a click
 * on the backdrop also cancels.
 */
export function MakeHostDialog({ target, onConfirm, onCancel }: MakeHostDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (target && !dialog.open) {
      dialog.showModal()
      // Start on Cancel so a stray Enter never hands the room away.
      cancelRef.current?.focus()
    } else if (!target && dialog.open) {
      dialog.close()
    }
  }, [target])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // Clicks inside the card land on its children; only the backdrop hits the dialog itself.
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={e => {
        e.preventDefault()
        onCancel()
      }}
      onClick={handleBackdropClick}
      aria-labelledby="make-host-title"
      aria-describedby="make-host-description"
      className="make-host-dialog w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-2xl"
    >
      {target && (
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold uppercase text-brand-700">
              {target.name.charAt(0)}
              <svg
                className="make-host-crown absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 text-brand-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
              </svg>
            </span>
            <h2 id="make-host-title" className="text-lg font-bold text-slate-900">
              Make {target.name} the host?
            </h2>
          </div>

          <p id="make-host-description" className="mb-6 text-sm leading-relaxed text-slate-600">
            {target.name} will be able to reveal votes, start new rounds and change the voting mode.
            You&apos;ll lose the host controls unless they hand them back.
          </p>

          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onConfirm(target.id)}>Make {target.name} host</Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
