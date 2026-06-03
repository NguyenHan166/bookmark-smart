export type ToastState = {
  tone: 'success' | 'error'
  message: string
  actionLabel?: string
  onAction?: () => void
}

type ToastProps = {
  toast: ToastState | null
  onDismiss: () => void
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  if (!toast) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-20 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-title)] px-4 py-3 text-white shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-semibold ${
            toast.tone === 'success'
              ? 'bg-emerald-400/15 text-emerald-300'
              : 'bg-red-400/15 text-red-300'
          }`}
        >
          {toast.tone === 'success' ? 'OK' : '!'}
        </span>
        <p className="max-w-xs pt-1 text-sm font-medium">{toast.message}</p>
        <div className="flex items-center gap-2">
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              onClick={toast.onAction}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-950 transition hover:opacity-90"
            >
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="rounded px-1 text-xs font-semibold text-white/70 transition hover:text-white"
            aria-label="Dismiss toast"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
