import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { FolderOption } from './folder-options'

type MoveBookmarksDialogProps = {
  isOpen: boolean
  selectedCount: number
  folderOptions: FolderOption[]
  defaultParentId: string
  onClose: () => void
  onMove: (parentId: string) => Promise<void>
}

export const MoveBookmarksDialog = ({
  isOpen,
  selectedCount,
  folderOptions,
  defaultParentId,
  onClose,
  onMove,
}: MoveBookmarksDialogProps) => {
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
      await onMove(String(formData.get('parentId') ?? ''))
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
        key={`${defaultParentId}-${isOpen}`}
        onSubmit={handleSubmit}
        className="p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Move bookmarks
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-title)]">
            Move {selectedCount} selected item{selectedCount === 1 ? '' : 's'}
          </h2>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-semibold text-[var(--color-muted)]">
            Destination folder
          </span>
          <select
            required
            name="parentId"
            defaultValue={defaultParentId}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
          >
            {folderOptions.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.label}
              </option>
            ))}
          </select>
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
            {isSubmitting ? 'Moving...' : 'Move'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
