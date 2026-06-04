import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { FlatBookmark } from '../types/bookmarks'

type NoteDialogProps = {
  bookmark: FlatBookmark | null
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => Promise<void>
}

export const NoteDialog = ({
  bookmark,
  isOpen,
  onClose,
  onSave,
}: NoteDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    }

    if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)

    try {
      await onSave(String(formData.get('note') ?? '').trim())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[min(92vw,30rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop:bg-slate-950/40"
    >
      <form
        key={`${bookmark?.id ?? 'none'}-${isOpen}`}
        onSubmit={handleSubmit}
        className="p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Bookmark note
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold text-[var(--color-title)]">
            {bookmark?.title ?? 'Selected bookmark'}
          </h2>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-semibold text-[var(--color-muted)]">
            Note
          </span>
          <textarea
            name="note"
            defaultValue={bookmark?.note ?? ''}
            rows={5}
            placeholder="Add a short note for this bookmark"
            className="mt-1 w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm leading-6 text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save note'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
