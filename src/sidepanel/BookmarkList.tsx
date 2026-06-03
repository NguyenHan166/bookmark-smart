import type { FlatBookmark, TagDefinition } from '../types/bookmarks'

const formatUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const trimmedPath = parsed.pathname.length > 28
      ? `${parsed.pathname.slice(0, 28)}...`
      : parsed.pathname
    return `${parsed.hostname}${trimmedPath}`
  } catch {
    return url
  }
}

const getFaviconUrl = (url: string) => {
  try {
    const parsed = new URL(url)

    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`
  } catch {
    return null
  }
}

const getDomainInitial = (domain: string) => {
  return domain.replace(/^www\./, '').charAt(0).toUpperCase() || 'B'
}

type BookmarkListProps = {
  bookmarks: FlatBookmark[]
  tagsById: Record<string, TagDefinition>
  selectedBookmarkIds: Set<string>
  onToggleBookmark: (bookmarkId: string) => void
  onOpenBookmark: (bookmark: FlatBookmark) => void
  onEditBookmark: (bookmark: FlatBookmark) => void
  onDeleteBookmark: (bookmark: FlatBookmark) => void
  onOpenTagDialog: (bookmark: FlatBookmark) => void
  onRemoveTag: (bookmarkId: string, tagId: string) => void
}

export const BookmarkList = ({
  bookmarks,
  tagsById,
  selectedBookmarkIds,
  onToggleBookmark,
  onOpenBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onOpenTagDialog,
  onRemoveTag,
}: BookmarkListProps) => (
  <ul className="min-w-0 space-y-2.5 overflow-hidden">
    {bookmarks.map((bookmark) => {
      const isSelected = selectedBookmarkIds.has(bookmark.id)

      return (
        <li
          key={bookmark.id}
          className={`min-w-0 overflow-hidden rounded-lg border bg-[var(--color-elevated)] px-3 py-2 transition ${
            isSelected
              ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-panel)]'
          }`}
        >
          <div className="grid min-w-0 grid-cols-[auto,auto,minmax(0,1fr)] items-center gap-2.5 md:grid-cols-[auto,auto,minmax(0,1fr),auto]">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleBookmark(bookmark.id)}
              aria-label={`Select ${bookmark.title}`}
              className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-xs font-semibold text-[var(--color-muted)]">
              {getDomainInitial(bookmark.domain)}
              {getFaviconUrl(bookmark.url) ? (
                <img
                  src={getFaviconUrl(bookmark.url) ?? undefined}
                  alt=""
                  className="absolute h-5 w-5"
                  loading="lazy"
                />
              ) : null}
            </span>
            <div className="min-w-0 py-0.5">
              <p
                className="max-w-full truncate text-sm font-semibold leading-5 text-[var(--color-title)]"
                title={bookmark.title}
              >
                {bookmark.title}
              </p>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
                <span className="max-w-[18rem] truncate" title={bookmark.url}>
                  {formatUrl(bookmark.url)}
                </span>
                {bookmark.folderPath.length > 0 ? (
                  <span
                    className="max-w-[18rem] truncate text-[11px]"
                    title={bookmark.folderPath.join(' / ')}
                  >
                    <span className="mr-1 text-[var(--color-accent)]">Folder</span>
                    {bookmark.folderPath.join(' / ')}
                  </span>
                ) : null}
                <span
                  className="rounded-md bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]"
                  title={bookmark.domain}
                >
                  {bookmark.domain}
                </span>
              </div>
              {bookmark.tagIds?.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {bookmark.tagIds.map((tagId) => {
                    const tag = tagsById[tagId]

                    if (!tag) {
                      return null
                    }

                    return (
                      <span
                        key={tagId}
                        className="inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold sm:max-w-[9rem]"
                        style={{
                          backgroundColor: `${tag.color ?? '#2563eb'}22`,
                          color: tag.color ?? '#2563eb',
                        }}
                      >
                        <span className="truncate">{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveTag(bookmark.id, tagId)}
                          className="text-current opacity-70 hover:opacity-100"
                          aria-label={`Remove ${tag.name} from ${bookmark.title}`}
                        >
                          x
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : null}
            </div>
            <div className="col-span-3 flex flex-wrap items-center gap-1 md:col-span-1 md:justify-end">
              <button
                type="button"
                onClick={() => onOpenBookmark(bookmark)}
                className="rounded-md bg-[var(--color-accent)] px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:opacity-90"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => onEditBookmark(bookmark)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onOpenTagDialog(bookmark)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Tags
              </button>
              <button
                type="button"
                onClick={() => onDeleteBookmark(bookmark)}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)]"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      )
    })}
  </ul>
)

type BulkActionBarProps = {
  selectedCount: number
  visibleCount: number
  areAllVisibleSelected: boolean
  onSelectVisible: () => void
  onClearSelection: () => void
  onOpenSelected: () => void
  onMoveSelected: () => void
  onTagSelected: () => void
  onDeleteSelected: () => void
}

export const BulkActionBar = ({
  selectedCount,
  visibleCount,
  areAllVisibleSelected,
  onSelectVisible,
  onClearSelection,
  onOpenSelected,
  onMoveSelected,
  onTagSelected,
  onDeleteSelected,
}: BulkActionBarProps) => {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="sticky bottom-4 z-10 mt-4 max-w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-title)] px-3 py-3 text-white shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-md bg-white/10 px-2 py-1 text-sm font-semibold">
          {selectedCount} selected
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSelected}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
          >
            Open
          </button>
          <button
            type="button"
            onClick={onMoveSelected}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
          >
            Move
          </button>
          <button
            type="button"
            onClick={onTagSelected}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
          >
            Tags
          </button>
          {visibleCount > 0 ? (
            <button
              type="button"
              onClick={onSelectVisible}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
            >
              {areAllVisibleSelected ? 'Unselect visible' : 'Select visible'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDeleteSelected}
            className="rounded-lg bg-[var(--color-danger)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-title)] transition hover:opacity-90"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
