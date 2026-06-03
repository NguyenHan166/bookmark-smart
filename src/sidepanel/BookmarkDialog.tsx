import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { FlatBookmark } from '../types/bookmarks'
import type { FolderOption } from './folder-options'

export type BookmarkFormValues = {
  title: string
  url: string
  parentId: string
}

type BookmarkDialogProps = {
  mode: 'add' | 'edit'
  bookmark: FlatBookmark | null
  folderOptions: FolderOption[]
  defaultParentId: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: BookmarkFormValues) => Promise<void>
}

export const BookmarkDialog = ({
  mode,
  bookmark,
  folderOptions,
  defaultParentId,
  isOpen,
  onClose,
  onSubmit,
}: BookmarkDialogProps) => {
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
      await onSubmit({
        title: String(formData.get('title') ?? '').trim(),
        url: String(formData.get('url') ?? '').trim(),
        parentId: String(formData.get('parentId') ?? ''),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const initialTitle = bookmark?.isUntitled ? '' : bookmark?.title ?? ''
  const initialUrl = bookmark?.url ?? ''
  const initialParentId = bookmark?.parentId ?? defaultParentId

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[min(92vw,28rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop:bg-slate-950/40"
    >
      <form
        key={`${mode}-${bookmark?.id ?? 'new'}-${initialParentId}-${isOpen}`}
        onSubmit={handleSubmit}
        className="p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {mode === 'add' ? 'Add bookmark' : 'Edit bookmark'}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-title)]">
            {mode === 'add' ? 'Save a new page' : 'Update bookmark details'}
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Title
            </span>
            <input
              name="title"
              defaultValue={initialTitle}
              placeholder="Bookmark title"
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              URL
            </span>
            <input
              required
              type="url"
              name="url"
              defaultValue={initialUrl}
              placeholder="https://example.com"
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Folder
            </span>
            <select
              required
              name="parentId"
              defaultValue={initialParentId}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
            >
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </select>
          </label>
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
            disabled={isSubmitting}
            className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
