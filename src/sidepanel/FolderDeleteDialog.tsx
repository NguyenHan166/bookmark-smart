import { useEffect, useRef, useState } from 'react'
import type { BookmarkFolder } from '../types/bookmarks'

type FolderDeleteDialogProps = {
  folder: BookmarkFolder | null
  bookmarkCount: number
  subfolderCount: number
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export const FolderDeleteDialog = ({
  folder,
  bookmarkCount,
  subfolderCount,
  isOpen,
  onClose,
  onConfirm,
}: FolderDeleteDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleConfirm = async () => {
    setIsDeleting(true)

    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[min(92vw,28rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop:bg-slate-950/40"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <span className="folder-glyph" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-danger)]">
              Delete folder
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-[var(--color-title)]">
              {folder?.title ?? 'Selected folder'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              This will delete {bookmarkCount} bookmark
              {bookmarkCount === 1 ? '' : 's'} and {subfolderCount} subfolder
              {subfolderCount === 1 ? '' : 's'} inside it.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-xs leading-5 text-[var(--color-muted)]">
          This action cannot be undone for folders. Bookmark metadata for deleted
          bookmarks will be cleaned up after the folder is removed.
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-md bg-[var(--color-danger)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete folder'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
