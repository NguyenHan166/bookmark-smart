import type { BookmarkFolder, TagDefinition } from '../types/bookmarks'
import { TagPanel } from './TagPanel'

type SidebarProps = {
  bookmarksCount: number
  folders: BookmarkFolder[]
  tags: TagDefinition[]
  tagCounts: Record<string, number>
  selectedFolderId: string | null
  selectedTagId: string | null
  canModifySelectedFolder: boolean
  isLoading: boolean
  hasError: boolean
  onSelectFolder: (folderId: string | null) => void
  onSelectTag: (tagId: string | null) => void
  onCreateFolder: () => void
  onCreateSubfolder: () => void
  onRenameSelectedFolder: () => void
  onMoveSelectedFolder: () => void
  onCreateTag: (name: string, color: string) => void
  onUpdateTag: (tagId: string, name: string, color: string) => void
  onDeleteTag: (tag: TagDefinition) => void
  onDeleteSelectedFolder: () => void
}

export const Sidebar = ({
  bookmarksCount,
  folders,
  tags,
  tagCounts,
  selectedFolderId,
  selectedTagId,
  canModifySelectedFolder,
  isLoading,
  hasError,
  onSelectFolder,
  onSelectTag,
  onCreateFolder,
  onCreateSubfolder,
  onRenameSelectedFolder,
  onMoveSelectedFolder,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onDeleteSelectedFolder,
}: SidebarProps) => (
  <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Folders
      </p>
      {isLoading ? (
        <span className="h-2 w-10 animate-pulse rounded bg-[var(--color-accent-soft)]" />
      ) : (
        <button
          type="button"
          onClick={onCreateFolder}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-1 text-[11px] font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)]"
        >
          New
        </button>
      )}
    </div>

    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition ${
          selectedFolderId === null
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-title)]'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-accent)]">
            <span className="library-glyph" />
          </span>
          <span className="truncate">All Bookmarks</span>
        </span>
        <CountBadge count={bookmarksCount} />
      </button>

      {isLoading ? (
        <FolderSkeleton />
      ) : hasError ? (
        <p className="rounded-md bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-muted)]">
          Folder tree is unavailable.
        </p>
      ) : (
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
        />
      )}
    </div>

    {selectedFolderId ? (
      <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3">
        <p className="text-xs font-semibold text-[var(--color-title)]">
          Folder actions
        </p>
        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
          {canModifySelectedFolder
            ? 'Organize this folder without changing bookmark metadata.'
            : 'Browser system folders can contain subfolders but cannot be renamed, moved, or deleted here.'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCreateSubfolder}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-2 text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)]"
          >
            New subfolder
          </button>
          <button
            type="button"
            onClick={onRenameSelectedFolder}
            disabled={!canModifySelectedFolder}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-2 text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={onMoveSelectedFolder}
            disabled={!canModifySelectedFolder}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 py-2 text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Move
          </button>
          <button
            type="button"
            onClick={onDeleteSelectedFolder}
            disabled={!canModifySelectedFolder}
            className="rounded-md bg-[var(--color-danger)] px-2 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Delete
          </button>
        </div>
      </div>
    ) : null}

    <TagPanel
      tags={tags}
      selectedTagId={selectedTagId}
      tagCounts={tagCounts}
      onSelectTag={onSelectTag}
      onCreateTag={onCreateTag}
      onUpdateTag={onUpdateTag}
      onDeleteTag={onDeleteTag}
    />
  </aside>
)

type FolderTreeProps = {
  folders: BookmarkFolder[]
  selectedFolderId: string | null
  onSelectFolder: (folderId: string) => void
  depth?: number
}

const FolderTree = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  depth = 0,
}: FolderTreeProps) => {
  if (folders.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-4 text-center">
        <span className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <span className="folder-glyph" />
        </span>
        <p className="mt-2 text-xs font-medium text-[var(--color-title)]">
          No folders yet
        </p>
        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
          New browser folders will show here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {folders.map((folder) => (
        <div key={folder.id}>
          <button
            type="button"
            onClick={() => onSelectFolder(folder.id)}
            className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition ${
              selectedFolderId === folder.id
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-title)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-warning)]">
                <span className="folder-glyph" />
              </span>
              <span className="truncate">{folder.title}</span>
            </span>
            <CountBadge count={folder.bookmarkCount} />
          </button>
          {folder.children.length > 0 ? (
            <FolderTree
              folders={folder.children}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              depth={depth + 1}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

const CountBadge = ({ count }: { count: number }) => (
  <span className="rounded-md bg-[var(--color-input)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
    {count}
  </span>
)

const FolderSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={`folder-skeleton-${index}`}
        className="h-8 animate-pulse rounded-md bg-[var(--color-accent-soft)]"
        style={{ marginLeft: `${index % 3 === 0 ? 0 : 12}px` }}
      />
    ))}
  </div>
)
