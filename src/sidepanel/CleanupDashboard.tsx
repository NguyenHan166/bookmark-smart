import type { FlatBookmark } from '../types/bookmarks'
import type { CleanupStats, DuplicateBookmarkGroup } from './cleanup-utils'

type CleanupDashboardProps = {
  stats: CleanupStats
  isReviewingDuplicates: boolean
  duplicateKeepIds: Record<string, string>
  onReviewDuplicates: () => void
  onBackToDashboard: () => void
  onReviewUntitled: () => void
  onReviewUntagged: () => void
  onSelectDuplicateKeep: (groupKey: string, bookmarkId: string) => void
  onDeleteDuplicateGroup: (group: DuplicateBookmarkGroup) => void
}

export const CleanupDashboard = ({
  stats,
  isReviewingDuplicates,
  duplicateKeepIds,
  onReviewDuplicates,
  onBackToDashboard,
  onReviewUntitled,
  onReviewUntagged,
  onSelectDuplicateKeep,
  onDeleteDuplicateGroup,
}: CleanupDashboardProps) => {
  if (isReviewingDuplicates) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Duplicate Review
            </p>
            <h2 className="text-lg font-semibold text-[var(--color-title)]">
              {stats.duplicateGroups.length} duplicate groups
            </h2>
          </div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Back
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {stats.duplicateGroups.length === 0 ? (
            <EmptyCleanupCard title="No duplicates found" />
          ) : (
            stats.duplicateGroups.map((group) => (
              <DuplicateGroupCard
                key={group.normalizedUrl}
                group={group}
                keepId={duplicateKeepIds[group.normalizedUrl] ?? group.bookmarks[0]?.id}
                onSelectKeep={(bookmarkId) =>
                  onSelectDuplicateKeep(group.normalizedUrl, bookmarkId)}
                onDelete={() => onDeleteDuplicateGroup(group)}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Cleanup
        </p>
        <h2 className="text-lg font-semibold text-[var(--color-title)]">
          Bookmark cleanup dashboard
        </h2>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <CleanupCard
          title="Duplicates"
          value={stats.duplicateBookmarkCount}
          detail={`${stats.duplicateGroups.length} groups by normalized URL`}
          buttonLabel="Review"
          onReview={onReviewDuplicates}
          disabled={stats.duplicateGroups.length === 0}
        />
        <CleanupCard
          title="Untitled"
          value={stats.untitledBookmarks.length}
          detail="Bookmarks without a title"
          buttonLabel="Review"
          onReview={onReviewUntitled}
          disabled={stats.untitledBookmarks.length === 0}
        />
        <CleanupCard
          title="Untagged"
          value={stats.untaggedBookmarks.length}
          detail="Bookmarks without MarkPilot tags"
          buttonLabel="Review"
          onReview={onReviewUntagged}
          disabled={stats.untaggedBookmarks.length === 0}
        />
      </div>
    </div>
  )
}

type CleanupCardProps = {
  title: string
  value: number
  detail: string
  buttonLabel: string
  disabled: boolean
  onReview: () => void
}

const CleanupCard = ({
  title,
  value,
  detail,
  buttonLabel,
  disabled,
  onReview,
}: CleanupCardProps) => (
  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
      {title}
    </p>
    <p className="mt-3 text-3xl font-semibold text-[var(--color-title)]">
      {value}
    </p>
    <p className="mt-1 min-h-10 text-xs text-[var(--color-muted)]">
      {detail}
    </p>
    <button
      type="button"
      onClick={onReview}
      disabled={disabled}
      className="mt-4 rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {buttonLabel}
    </button>
  </div>
)

const EmptyCleanupCard = ({ title }: { title: string }) => (
  <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-10 text-center">
    <p className="text-sm font-semibold text-[var(--color-title)]">{title}</p>
  </div>
)

type DuplicateGroupCardProps = {
  group: DuplicateBookmarkGroup
  keepId?: string
  onSelectKeep: (bookmarkId: string) => void
  onDelete: () => void
}

const DuplicateGroupCard = ({
  group,
  keepId,
  onSelectKeep,
  onDelete,
}: DuplicateGroupCardProps) => {
  const deleteCount = group.bookmarks.filter((bookmark) => bookmark.id !== keepId)
    .length

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-title)]">
            {group.normalizedUrl}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {group.bookmarks.length} copies
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteCount === 0}
          className="rounded-md bg-[var(--color-danger)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete {deleteCount}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {group.bookmarks.map((bookmark) => (
          <DuplicateBookmarkOption
            key={bookmark.id}
            bookmark={bookmark}
            checked={bookmark.id === keepId}
            onSelect={() => onSelectKeep(bookmark.id)}
          />
        ))}
      </div>
    </div>
  )
}

type DuplicateBookmarkOptionProps = {
  bookmark: FlatBookmark
  checked: boolean
  onSelect: () => void
}

const DuplicateBookmarkOption = ({
  bookmark,
  checked,
  onSelect,
}: DuplicateBookmarkOptionProps) => (
  <label className="flex items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2">
    <input
      type="radio"
      checked={checked}
      onChange={onSelect}
      className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
    />
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold text-[var(--color-title)]">
        Keep {bookmark.title}
      </span>
      <span className="mt-1 block truncate text-xs text-[var(--color-muted)]">
        {bookmark.folderPath.length > 0
          ? bookmark.folderPath.join(' / ')
          : 'Root folder'}
      </span>
    </span>
  </label>
)
