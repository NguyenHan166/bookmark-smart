import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { FolderOption } from './folder-options'

export type FolderDialogMode = 'create' | 'rename' | 'move'

export type FolderFormValues = {
  title: string
  parentId: string
}

type FolderDialogProps = {
  mode: FolderDialogMode
  folderName: string
  folderOptions: FolderOption[]
  defaultParentId: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: FolderFormValues) => Promise<void>
}

const dialogCopy = {
  create: {
    eyebrow: 'New folder',
    title: 'Create a bookmark folder',
    submit: 'Create folder',
    submitting: 'Creating...',
  },
  rename: {
    eyebrow: 'Rename folder',
    title: 'Update folder name',
    submit: 'Rename',
    submitting: 'Renaming...',
  },
  move: {
    eyebrow: 'Move folder',
    title: 'Choose a new parent folder',
    submit: 'Move',
    submitting: 'Moving...',
  },
} as const

export const FolderDialog = ({
  mode,
  folderName,
  folderOptions,
  defaultParentId,
  isOpen,
  onClose,
  onSubmit,
}: FolderDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const copy = dialogCopy[mode]
  const needsTitle = mode === 'create' || mode === 'rename'
  const needsParent = mode === 'create' || mode === 'move'

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
        parentId: String(formData.get('parentId') ?? ''),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="w-[min(92vw,28rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-0 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop:bg-slate-950/40"
    >
      <form
        key={`${mode}-${folderName}-${defaultParentId}-${isOpen}`}
        onSubmit={handleSubmit}
        className="p-5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-title)]">
            {copy.title}
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          {needsTitle ? (
            <label className="block">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                Folder name
              </span>
              <input
                required
                name="title"
                defaultValue={mode === 'rename' ? folderName : ''}
                placeholder="Folder name"
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          ) : null}

          {needsParent ? (
            <label className="block">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                Parent folder
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
          ) : null}
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
            {isSubmitting ? copy.submitting : copy.submit}
          </button>
        </div>
      </form>
    </dialog>
  )
}
