import type { RefObject } from 'react'
import {
  quickFilterLabels,
  type QuickFilter,
} from './bookmark-filters'

type BookmarkToolbarProps = {
  title: string
  itemCountLabel: string
  searchQuery: string
  quickFilter: QuickFilter
  selectedCount: number
  areAllVisibleSelected: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onSearchChange: (value: string) => void
  onQuickFilterChange: (filter: QuickFilter) => void
  onToggleVisibleSelection: () => void
  onDeleteSelected: () => void
}

export const BookmarkToolbar = ({
  title,
  itemCountLabel,
  searchQuery,
  quickFilter,
  selectedCount,
  areAllVisibleSelected,
  searchInputRef,
  onSearchChange,
  onQuickFilterChange,
  onToggleVisibleSelection,
  onDeleteSelected,
}: BookmarkToolbarProps) => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {title}
        </p>
        <p className="text-sm text-[var(--color-muted)]">{itemCountLabel}</p>
      </div>
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-muted)] focus-within:border-[var(--color-accent)] sm:max-w-xs">
        <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-semibold">
          /
        </span>
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search bookmarks"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-title)] outline-none placeholder:text-[var(--color-muted)]"
        />
      </label>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-2">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(quickFilterLabels) as QuickFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onQuickFilterChange(filter)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              quickFilter === filter
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
            }`}
          >
            {quickFilterLabels[filter]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold text-[var(--color-muted)]">
          {selectedCount > 0
            ? `${selectedCount} selected`
            : 'Select bookmarks for bulk actions'}
        </p>
        <button
          type="button"
          onClick={onToggleVisibleSelection}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
        >
          {areAllVisibleSelected ? 'Unselect visible' : 'Select visible'}
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="rounded-md bg-[var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete selected
        </button>
      </div>
    </div>
  </div>
)
