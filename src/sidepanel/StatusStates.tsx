type LoadingListProps = {
  count?: number
}

export const LoadingList = ({ count = 6 }: LoadingListProps) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="h-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-3"
      >
        <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-accent-soft)]" />
        <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-[var(--color-accent-soft)]" />
        <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-[var(--color-accent-soft)]" />
      </div>
    ))}
  </div>
)

type EmptyStateProps = {
  isLibraryEmpty: boolean
  hasActiveFilters: boolean
}

export const EmptyState = ({
  isLibraryEmpty,
  hasActiveFilters,
}: EmptyStateProps) => {
  const title = isLibraryEmpty
    ? 'No bookmarks yet'
    : hasActiveFilters
      ? 'No matches'
      : 'This folder has no bookmarks'
  const message = isLibraryEmpty
    ? 'Add bookmarks in Chrome or Edge, then refresh MarkPilot.'
    : hasActiveFilters
      ? 'Try a different keyword or clear filters.'
      : 'Pick another folder or return to All Bookmarks.'

  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
        <span className="library-glyph scale-125" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[var(--color-title)]">
        {title}
      </p>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{message}</p>
    </div>
  )
}

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-6">
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-danger-soft)] text-sm font-semibold text-[var(--color-danger)]">
      !
    </span>
    <p className="mt-3 text-sm font-semibold text-[var(--color-title)]">
      Unable to load bookmarks
    </p>
    <p className="mt-2 text-xs text-[var(--color-muted)]">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white"
    >
      Try again
    </button>
  </div>
)
