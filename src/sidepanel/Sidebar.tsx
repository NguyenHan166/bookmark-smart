import { useEffect, useState } from 'react'
import type { BookmarkFolder, TagDefinition } from '../types/bookmarks'
import { TagPanel } from './TagPanel'

type SidebarProps = {
  bookmarksCount: number
  folders: BookmarkFolder[]
  tags: TagDefinition[]
  tagCounts: Record<string, number>
  selectedFolderId: string | null
  selectedTagId: string | null
  isLoading: boolean
  hasError: boolean
  onSelectFolder: (folderId: string | null) => void
  onSelectTag: (tagId: string | null) => void
  onCreateFolder: () => void
  onCreateSubfolder: (folder: BookmarkFolder) => void
  onRenameFolder: (folder: BookmarkFolder) => void
  onMoveFolder: (folder: BookmarkFolder) => void
  onCreateTag: (name: string, color: string) => void
  onUpdateTag: (tagId: string, name: string, color: string) => void
  onDeleteTag: (tag: TagDefinition) => void
  onDeleteFolder: (folder: BookmarkFolder) => void
}

export const Sidebar = ({
  bookmarksCount,
  folders,
  tags,
  tagCounts,
  selectedFolderId,
  selectedTagId,
  isLoading,
  hasError,
  onSelectFolder,
  onSelectTag,
  onCreateFolder,
  onCreateSubfolder,
  onRenameFolder,
  onMoveFolder,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onDeleteFolder,
}: SidebarProps) => {
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuFolderId) {
      return
    }

    const closeMenu = () => setOpenMenuFolderId(null)

    window.addEventListener('click', closeMenu)

    return () => window.removeEventListener('click', closeMenu)
  }, [openMenuFolderId])

  const selectFolder = (folderId: string | null) => {
    setOpenMenuFolderId(null)
    onSelectFolder(folderId)
  }

  return (
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
            title="New folder"
            className="grid h-7 w-7 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-sm font-semibold text-[var(--color-title)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          >
            +
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => selectFolder(null)}
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
            openMenuFolderId={openMenuFolderId}
            onOpenMenuFolderChange={setOpenMenuFolderId}
            onSelectFolder={selectFolder}
            onCreateSubfolder={onCreateSubfolder}
            onRenameFolder={onRenameFolder}
            onMoveFolder={onMoveFolder}
            onDeleteFolder={onDeleteFolder}
          />
        )}
      </div>

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
}

type FolderTreeProps = {
  folders: BookmarkFolder[]
  selectedFolderId: string | null
  openMenuFolderId: string | null
  onOpenMenuFolderChange: (folderId: string | null) => void
  onSelectFolder: (folderId: string) => void
  onCreateSubfolder: (folder: BookmarkFolder) => void
  onRenameFolder: (folder: BookmarkFolder) => void
  onMoveFolder: (folder: BookmarkFolder) => void
  onDeleteFolder: (folder: BookmarkFolder) => void
  depth?: number
}

const FolderTree = ({
  folders,
  selectedFolderId,
  openMenuFolderId,
  onOpenMenuFolderChange,
  onSelectFolder,
  onCreateSubfolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
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
      {folders.map((folder) => {
        const isSelected = selectedFolderId === folder.id
        const canModify = !isSystemFolder(folder)
        const isMenuOpen = openMenuFolderId === folder.id

        return (
          <div key={folder.id} className="group relative">
            <div
              className={`flex w-full items-center rounded-md transition ${
                isSelected
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-title)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 text-left text-sm"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-warning)]">
                  <span className="folder-glyph" />
                </span>
                <span className="truncate">{folder.title}</span>
              </button>
              <span className="ml-1 flex shrink-0 items-center gap-1 pr-1">
                <CountBadge count={folder.bookmarkCount} />
                <button
                  type="button"
                  title="Folder actions"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenMenuFolderChange(isMenuOpen ? null : folder.id)
                  }}
                  className={`grid h-6 w-6 place-items-center rounded-md border border-transparent text-sm font-semibold transition ${
                    isMenuOpen
                      ? 'border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-title)]'
                      : 'border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                  }`}
                >
                  ...
                </button>
              </span>
            </div>
            {isMenuOpen ? (
              <FolderActionMenu
                folder={folder}
                canModify={canModify}
                onCreateSubfolder={() => {
                  onOpenMenuFolderChange(null)
                  onCreateSubfolder(folder)
                }}
                onRename={() => {
                  onOpenMenuFolderChange(null)
                  onRenameFolder(folder)
                }}
                onMove={() => {
                  onOpenMenuFolderChange(null)
                  onMoveFolder(folder)
                }}
                onDelete={() => {
                  onOpenMenuFolderChange(null)
                  onDeleteFolder(folder)
                }}
              />
            ) : null}
            {folder.children.length > 0 ? (
              <FolderTree
                folders={folder.children}
                selectedFolderId={selectedFolderId}
                openMenuFolderId={openMenuFolderId}
                onOpenMenuFolderChange={onOpenMenuFolderChange}
                onSelectFolder={onSelectFolder}
                onCreateSubfolder={onCreateSubfolder}
                onRenameFolder={onRenameFolder}
                onMoveFolder={onMoveFolder}
                onDeleteFolder={onDeleteFolder}
                depth={depth + 1}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

type FolderActionMenuProps = {
  folder: BookmarkFolder
  canModify: boolean
  onCreateSubfolder: () => void
  onRename: () => void
  onMove: () => void
  onDelete: () => void
}

const FolderActionMenu = ({
  folder,
  canModify,
  onCreateSubfolder,
  onRename,
  onMove,
  onDelete,
}: FolderActionMenuProps) => (
  <div className="absolute right-1 top-8 z-20 w-44 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-[var(--shadow-soft)]">
    <button
      type="button"
      onClick={onCreateSubfolder}
      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)]"
    >
      <span>New subfolder</span>
      <span className="text-[var(--color-muted)]">+</span>
    </button>
    <button
      type="button"
      onClick={onRename}
      disabled={!canModify}
      className="w-full rounded-md px-2 py-2 text-left text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--color-muted)] disabled:opacity-45"
    >
      Rename
    </button>
    <button
      type="button"
      onClick={onMove}
      disabled={!canModify}
      className="w-full rounded-md px-2 py-2 text-left text-xs font-semibold text-[var(--color-title)] transition hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--color-muted)] disabled:opacity-45"
    >
      Move to...
    </button>
    <div className="my-1 border-t border-[var(--color-border)]" />
    <button
      type="button"
      onClick={onDelete}
      disabled={!canModify}
      className="w-full rounded-md px-2 py-2 text-left text-xs font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)] disabled:cursor-not-allowed disabled:text-[var(--color-muted)] disabled:opacity-45"
    >
      Delete
    </button>
    {!canModify ? (
      <p className="px-2 pb-2 pt-1 text-[10px] leading-4 text-[var(--color-muted)]">
        {folder.title} is managed by the browser.
      </p>
    ) : null}
  </div>
)

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

const isSystemFolder = (folder: BookmarkFolder) => {
  return !folder.parentId || folder.parentId === '0'
}
