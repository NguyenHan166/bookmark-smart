import { useState } from 'react'
import { openSidePanel } from '../lib/chrome-api'

export default function Popup() {
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async () => {
    setError(null)
    try {
      await openSidePanel()
      window.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open side panel.')
    }
  }

  return (
    <div className="w-[320px] bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="p-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold text-[var(--color-title)]">
            MarkPilot
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Open the side panel to manage your bookmarks.
          </p>
          <button
            type="button"
            onClick={handleOpen}
            className="mt-4 w-full rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open MarkPilot
          </button>
          {error ? (
            <p className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
