import type { FlatBookmark, TagDefinition } from '../types/bookmarks'

const formatUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname

    return `${parsed.hostname}${path}`
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
  onTogglePinned: (bookmark: FlatBookmark) => void
  onOpenNoteDialog: (bookmark: FlatBookmark) => void
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
  onTogglePinned,
  onOpenNoteDialog,
}: BookmarkListProps) => (
  <ul className="min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-soft)]">
    {bookmarks.map((bookmark) => {
      const isSelected = selectedBookmarkIds.has(bookmark.id)
      const tagIds = bookmark.tagIds ?? []
      const visibleTagIds = tagIds.slice(0, 2)
      const hiddenTagCount = Math.max(0, tagIds.length - visibleTagIds.length)

      return (
        <li
          key={bookmark.id}
          className={`group min-w-0 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 transition last:border-b-0 ${
            isSelected
              ? 'bg-[var(--color-accent-soft)] shadow-[inset_3px_0_0_var(--color-accent)]'
              : 'hover:bg-[var(--color-elevated)]'
          }`}
        >
          <div className="grid min-h-14 min-w-0 grid-cols-[1.25rem,2rem,minmax(0,1fr),auto] items-center gap-2.5">
            <label className="grid h-7 w-5 place-items-center" title="Select bookmark">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleBookmark(bookmark.id)}
                aria-label={`Select ${bookmark.title}`}
                className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
              />
            </label>
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
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {bookmark.isPinned ? (
                  <span
                    className="shrink-0 rounded-md bg-[var(--color-warning)] px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    title="Pinned"
                  >
                    Pin
                  </span>
                ) : null}
                <p
                  className="min-w-0 truncate text-sm font-semibold leading-5 text-[var(--color-title)]"
                  title={bookmark.title}
                >
                  {bookmark.title}
                </p>
                {bookmark.note ? (
                  <span
                    className="shrink-0 rounded-md bg-[var(--color-input)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]"
                    title={bookmark.note}
                  >
                    Note
                  </span>
                ) : null}
                <span
                  className="hidden shrink-0 rounded-md bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)] sm:inline-flex"
                  title={bookmark.domain}
                >
                  {bookmark.domain}
                </span>
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <span
                  className="min-w-0 max-w-[42%] truncate"
                  title={bookmark.url}
                >
                  {formatUrl(bookmark.url)}
                </span>
                {bookmark.folderPath.length > 0 ? (
                  <>
                    <span className="shrink-0 text-[var(--color-border)]">/</span>
                    <span
                      className="min-w-0 max-w-[34%] truncate"
                      title={bookmark.folderPath.join(' / ')}
                    >
                      {bookmark.folderPath.join(' / ')}
                    </span>
                  </>
                ) : null}
                {tagIds.length > 0 ? (
                  <div className="hidden min-w-0 shrink-0 items-center gap-1 lg:flex">
                    {visibleTagIds.map((tagId) => {
                    const tag = tagsById[tagId]

                    if (!tag) {
                      return null
                    }

                    return (
                      <span
                        key={tagId}
                        className="inline-flex max-w-[7rem] items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
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
                    {hiddenTagCount > 0 ? (
                      <span
                        className="rounded-md bg-[var(--color-input)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]"
                        title={`${hiddenTagCount} more tag${hiddenTagCount === 1 ? '' : 's'}`}
                      >
                        +{hiddenTagCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
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
                className="hidden rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] sm:inline-flex"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onOpenTagDialog(bookmark)}
                className="hidden rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] md:inline-flex"
              >
                Tags
              </button>
              <button
                type="button"
                onClick={() => onOpenNoteDialog(bookmark)}
                className="hidden rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] lg:inline-flex"
              >
                Note
              </button>
              <button
                type="button"
                onClick={() => onTogglePinned(bookmark)}
                className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold transition ${
                  bookmark.isPinned
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning)] text-white hover:opacity-90'
                    : 'border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
                }`}
              >
                {bookmark.isPinned ? 'Unpin' : 'Pin'}
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
