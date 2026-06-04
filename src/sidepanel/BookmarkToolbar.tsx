import type { ReactNode, RefObject } from 'react'
import type { TagDefinition } from '../types/bookmarks'
import {
  quickFilterLabels,
  type BookmarkSort,
  type QuickFilter,
} from './bookmark-filters'
import type { FolderOption } from './folder-options'

type BookmarkToolbarProps = {
  title: string
  itemCountLabel: string
  searchQuery: string
  quickFilter: QuickFilter
  folderId: string | null
  tagId: string | null
  domain: string
  sameDomainOnly: boolean
  sort: BookmarkSort
  folderOptions: FolderOption[]
  tags: TagDefinition[]
  domainOptions: string[]
  selectedCount: number
  areAllVisibleSelected: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onSearchChange: (value: string) => void
  onQuickFilterChange: (filter: QuickFilter) => void
  onFolderChange: (folderId: string | null) => void
  onTagChange: (tagId: string | null) => void
  onDomainChange: (domain: string) => void
  onSameDomainOnlyChange: (enabled: boolean) => void
  onSortChange: (sort: BookmarkSort) => void
  onToggleVisibleSelection: () => void
  onDeleteSelected: () => void
}

export const BookmarkToolbar = ({
  title,
  itemCountLabel,
  searchQuery,
  quickFilter,
  folderId,
  tagId,
  domain,
  sameDomainOnly,
  sort,
  folderOptions,
  tags,
  domainOptions,
  selectedCount,
  areAllVisibleSelected,
  searchInputRef,
  onSearchChange,
  onQuickFilterChange,
  onFolderChange,
  onTagChange,
  onDomainChange,
  onSameDomainOnlyChange,
  onSortChange,
  onToggleVisibleSelection,
  onDeleteSelected,
}: BookmarkToolbarProps) => (
  <div className="min-w-0 overflow-hidden">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
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

    <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-2">
      <div className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-5">
        <ToolbarSelect
          label="Domain"
          value={domain}
          onChange={onDomainChange}
        >
          <option value="">All domains</option>
          {domainOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </ToolbarSelect>

        <ToolbarSelect
          label="Folder"
          value={folderId ?? ''}
          onChange={(value) => onFolderChange(value || null)}
        >
          <option value="">All folders</option>
          {folderOptions.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.label}
            </option>
          ))}
        </ToolbarSelect>

        <ToolbarSelect
          label="Tag"
          value={tagId ?? ''}
          onChange={(value) => onTagChange(value || null)}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </ToolbarSelect>

        <ToolbarSelect
          label="Sort"
          value={sort}
          onChange={(value) => onSortChange(value as BookmarkSort)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title A-Z</option>
          <option value="domain-asc">Domain A-Z</option>
        </ToolbarSelect>

        <label className={`flex min-w-0 items-center justify-between rounded-md border px-3 py-2 text-xs font-semibold transition ${
          sameDomainOnly
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
        }`}>
          <span className="truncate">Same domain</span>
          <input
            type="checkbox"
            checked={sameDomainOnly}
            onChange={(event) => onSameDomainOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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

      <div className="flex min-w-0 flex-wrap items-center gap-2">
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
  </div>
)

type ToolbarSelectProps = {
  label: string
  value: string
  children: ReactNode
  onChange: (value: string) => void
}

const ToolbarSelect = ({
  label,
  value,
  children,
  onChange,
}: ToolbarSelectProps) => (
  <label className="min-w-0">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full min-w-0 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 text-xs font-semibold text-[var(--color-title)] outline-none transition focus:border-[var(--color-accent)]"
      title={label}
    >
      {children}
    </select>
  </label>
)
