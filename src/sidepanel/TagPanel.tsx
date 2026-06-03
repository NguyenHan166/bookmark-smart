import { type FormEvent, useState } from 'react'
import type { TagDefinition } from '../types/bookmarks'

const colorOptions = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#d97706']

type TagPanelProps = {
  tags: TagDefinition[]
  selectedTagId: string | null
  tagCounts: Record<string, number>
  onSelectTag: (tagId: string | null) => void
  onCreateTag: (name: string, color: string) => void
  onUpdateTag: (tagId: string, name: string, color: string) => void
  onDeleteTag: (tag: TagDefinition) => void
}

export const TagPanel = ({
  tags,
  selectedTagId,
  tagCounts,
  onSelectTag,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagPanelProps) => {
  const [editingTagId, setEditingTagId] = useState<string | null>(null)

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const color = String(formData.get('color') ?? colorOptions[0])

    if (!name) {
      return
    }

    onCreateTag(name, color)
    event.currentTarget.reset()
  }

  const handleUpdate = (
    event: FormEvent<HTMLFormElement>,
    tag: TagDefinition,
  ) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const color = String(formData.get('color') ?? tag.color ?? colorOptions[0])

    if (!name) {
      return
    }

    onUpdateTag(tag.id, name, color)
    setEditingTagId(null)
  }

  return (
    <div className="mt-5 border-t border-[var(--color-border)] pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Tags
        </p>
        {selectedTagId ? (
          <button
            type="button"
            onClick={() => onSelectTag(null)}
            className="text-xs font-semibold text-[var(--color-accent)]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <form onSubmit={handleCreate} className="mt-3 space-y-2">
        <input
          name="name"
          placeholder="New tag"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
        />
        <div className="flex items-center justify-between gap-2">
          <select
            name="color"
            defaultValue={colorOptions[0]}
            className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-2 text-xs text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
          >
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mt-3 space-y-2">
        {tags.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            No tags yet.
          </p>
        ) : (
          tags.map((tag) => {
            const isSelected = selectedTagId === tag.id

            if (editingTagId === tag.id) {
              return (
                <form
                  key={tag.id}
                  onSubmit={(event) => handleUpdate(event, tag)}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-2"
                >
                  <input
                    name="name"
                    defaultValue={tag.name}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-1 text-xs text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      name="color"
                      defaultValue={tag.color ?? colorOptions[0]}
                      className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-1 text-xs text-[var(--color-title)] outline-none focus:border-[var(--color-accent)]"
                    >
                      {colorOptions.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTagId(null)}
                      className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold text-[var(--color-muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div key={tag.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectTag(isSelected ? null : tag.id)}
                  className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-title)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color ?? colorOptions[0] }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-muted)]">
                      {tagCounts[tag.id] ?? 0}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTagId(tag.id)}
                  className="rounded-md px-2 py-2 text-[10px] font-semibold text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTag(tag)}
                  className="rounded-md px-2 py-2 text-[10px] font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                >
                  Del
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
