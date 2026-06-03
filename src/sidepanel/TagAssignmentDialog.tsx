import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { TagDefinition } from '../types/bookmarks'

type TagAssignmentDialogProps = {
  isOpen: boolean
  tags: TagDefinition[]
  targetCount: number
  initialTagIds: string[]
  onClose: () => void
  onApply: (tagIds: string[]) => Promise<void>
}

export const TagAssignmentDialog = ({
  isOpen,
  tags,
  targetCount,
  initialTagIds,
  onClose,
  onApply,
}: TagAssignmentDialogProps) => {
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
    const formData = new FormData(event.currentTarget)
    const tagIds = formData.getAll('tagIds').map((item) => String(item))

    setIsSubmitting(true)

    try {
      await onApply(tagIds)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[min(92vw,26rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop:bg-slate-950/40"
    >
      <form
        key={`${isOpen}-${initialTagIds.join('-')}`}
        onSubmit={handleSubmit}
        className="p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Assign tags
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-title)]">
            Tag {targetCount} bookmark{targetCount === 1 ? '' : 's'}
          </h2>
        </div>

        <div className="mt-5 max-h-64 space-y-2 overflow-auto pr-1">
          {tags.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-5 text-center text-sm text-[var(--color-muted)]">
              Create a tag first.
            </p>
          ) : (
            tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color ?? '#2563eb' }}
                  />
                  <span className="truncate text-sm font-semibold text-[var(--color-title)]">
                    {tag.name}
                  </span>
                </span>
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={initialTagIds.includes(tag.id)}
                  className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                />
              </label>
            ))
          )}
        </div>

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
            disabled={isSubmitting || tags.length === 0}
            className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
