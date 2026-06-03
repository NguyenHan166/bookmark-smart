import type { ReactNode } from 'react'

export type SidePanelView = 'bookmarks' | 'cleanup'

type AppShellProps = {
  activeView: SidePanelView
  showSidebar: boolean
  onToggleSidebar: () => void
  onChangeView: (view: SidePanelView) => void
  onAddBookmark: () => void
  onRefresh: () => void
  sidebar: ReactNode
  children: ReactNode
}

export const AppShell = ({
  activeView,
  showSidebar,
  onToggleSidebar,
  onChangeView,
  onAddBookmark,
  onRefresh,
  sidebar,
  children,
}: AppShellProps) => (
  <div className="min-h-screen bg-[var(--color-bg)]">
    <div className="px-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 shadow-[var(--shadow-soft)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            MarkPilot
          </p>
          <h1 className="text-lg font-semibold text-[var(--color-title)]">
            Smart Bookmark Manager
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] md:hidden"
          >
            {showSidebar ? 'Hide folders' : 'Show folders'}
          </button>

          <div className="flex rounded-md border border-[var(--color-border)] bg-[var(--color-input)] p-0.5">
            {(['bookmarks', 'cleanup'] as SidePanelView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onChangeView(view)}
                className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  activeView === view
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-title)]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onAddBookmark}
            className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-[248px,1fr]">
        {showSidebar ? sidebar : null}
        <main className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
          {children}
        </main>
      </div>
    </div>
  </div>
)
