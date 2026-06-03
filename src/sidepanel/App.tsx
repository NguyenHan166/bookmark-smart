import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createBookmark,
  clearDeleteUndoState,
  createTagDefinition,
  deleteTagDefinition,
  getBookmarkTree,
  getMetadataStore,
  getTagStore,
  isChromeBookmarksAvailable,
  moveBookmark,
  openBookmarkInTab,
  removeBookmark,
  removeTagFromBookmark,
  restoreLastDeletedBookmarks,
  saveDeleteUndoState,
  setTagsForBookmarks,
  updateTagDefinition,
  updateBookmark,
} from '../lib/chrome-api'
import { buildFolderTree, flattenBookmarks } from '../lib/bookmark-utils'
import type {
  BookmarkFolder,
  DeletedBookmarkSnapshot,
  FlatBookmark,
  TagDefinition,
} from '../types/bookmarks'
import {
  BookmarkDialog,
  type BookmarkFormValues,
} from './BookmarkDialog'
import { BookmarkList, BulkActionBar } from './BookmarkList'
import { CleanupDashboard } from './CleanupDashboard'
import { MoveBookmarksDialog } from './MoveBookmarksDialog'
import { TagAssignmentDialog } from './TagAssignmentDialog'
import { TagPanel } from './TagPanel'
import { Toast, type ToastState } from './Toast'
import {
  filterBookmarks,
  quickFilterLabels,
  type QuickFilter,
} from './bookmark-filters'
import { getCleanupStats, type DuplicateBookmarkGroup } from './cleanup-utils'
import { getFolderOptions } from './folder-options'

type SidePanelView = 'bookmarks' | 'cleanup'

export default function App() {
  const [bookmarks, setBookmarks] = useState<FlatBookmark[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [tags, setTags] = useState<TagDefinition[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFolders, setShowFolders] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [activeView, setActiveView] = useState<SidePanelView>('bookmarks')
  const [isReviewingDuplicates, setIsReviewingDuplicates] = useState(false)
  const [duplicateKeepIds, setDuplicateKeepIds] = useState<Record<string, string>>(
    {},
  )
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [bookmarkDialogMode, setBookmarkDialogMode] = useState<'add' | 'edit'>(
    'add',
  )
  const [editingBookmark, setEditingBookmark] = useState<FlatBookmark | null>(
    null,
  )
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [tagDialogBookmarkIds, setTagDialogBookmarkIds] = useState<string[]>([])
  const [tagDialogInitialTagIds, setTagDialogInitialTagIds] = useState<string[]>(
    [],
  )
  const [toast, setToast] = useState<ToastState | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadBookmarks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!isChromeBookmarksAvailable()) {
        throw new Error('Open MarkPilot inside Chrome or Edge to load bookmarks.')
      }

      const [tree, metadataStore, tagStore] = await Promise.all([
        getBookmarkTree(),
        getMetadataStore(),
        getTagStore(),
      ])
      const knownTagIds = new Set(Object.keys(tagStore.tags))
      const nextBookmarks = flattenBookmarks(tree).map((bookmark) => ({
        ...bookmark,
        tagIds: (metadataStore.bookmarks[bookmark.id]?.tags ?? [])
          .filter((tagId) => knownTagIds.has(tagId)),
      }))
      const nextTags = Object.values(tagStore.tags)
        .sort((left, right) => left.name.localeCompare(right.name))

      setBookmarks(nextBookmarks)
      setFolders(buildFolderTree(tree))
      setTags(nextTags)
      setSelectedBookmarkIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bookmarks.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBookmarks()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const filteredBookmarks = useMemo(() => {
    return filterBookmarks({
      bookmarks,
      folderId: selectedFolderId,
      tagId: selectedTagId,
      searchQuery,
      quickFilter,
    })
  }, [bookmarks, quickFilter, searchQuery, selectedFolderId, selectedTagId])

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) {
      return null
    }

    return findFolder(folders, selectedFolderId)
  }, [folders, selectedFolderId])

  const listTitle = selectedFolder?.title ?? 'All Bookmarks'
  const isEmptyLibrary = bookmarks.length === 0
  const selectedCount = selectedBookmarkIds.size
  const folderOptions = useMemo(() => getFolderOptions(folders), [folders])
  const tagsById = useMemo(() => {
    return Object.fromEntries(tags.map((tag) => [tag.id, tag]))
  }, [tags])
  const tagCounts = useMemo(() => {
    return bookmarks.reduce<Record<string, number>>((counts, bookmark) => {
      bookmark.tagIds?.forEach((tagId) => {
        counts[tagId] = (counts[tagId] ?? 0) + 1
      })

      return counts
    }, {})
  }, [bookmarks])
  const defaultParentId = selectedFolderId ?? folderOptions[0]?.id ?? ''
  const selectedBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => selectedBookmarkIds.has(bookmark.id))
  }, [bookmarks, selectedBookmarkIds])
  const cleanupStats = useMemo(() => getCleanupStats(bookmarks), [bookmarks])
  const areAllVisibleSelected = filteredBookmarks.length > 0 &&
    filteredBookmarks.every((bookmark) => selectedBookmarkIds.has(bookmark.id))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping = target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping
      ) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if (event.key === 'Escape') {
        if (selectedBookmarkIds.size > 0) {
          event.preventDefault()
          setSelectedBookmarkIds(new Set())
          return
        }

        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBookmarkIds.size])

  const toggleBookmarkSelection = (bookmarkId: string) => {
    setSelectedBookmarkIds((current) => {
      const next = new Set(current)

      if (next.has(bookmarkId)) {
        next.delete(bookmarkId)
      } else {
        next.add(bookmarkId)
      }

      return next
    })
  }

  const toggleVisibleSelection = () => {
    setSelectedBookmarkIds((current) => {
      const next = new Set(current)

      if (areAllVisibleSelected) {
        filteredBookmarks.forEach((bookmark) => next.delete(bookmark.id))
      } else {
        filteredBookmarks.forEach((bookmark) => next.add(bookmark.id))
      }

      return next
    })
  }

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast)
    window.setTimeout(() => {
      setToast((current) => current === nextToast ? null : current)
    }, 4000)
  }

  const reloadAfterAction = async (message: string) => {
    await loadBookmarks()
    showToast({ tone: 'success', message })
  }

  const createDeleteSnapshot = (
    bookmark: FlatBookmark,
  ): DeletedBookmarkSnapshot => ({
    id: bookmark.id,
    title: bookmark.isUntitled ? '' : bookmark.title,
    url: bookmark.url,
    parentId: bookmark.parentId,
    index: bookmark.index,
  })

  const handleUndoDelete = async () => {
    try {
      setToast(null)
      const result = await restoreLastDeletedBookmarks()
      await loadBookmarks()
      showToast({
        tone: result.failedCount > 0 ? 'error' : 'success',
        message: result.failedCount > 0
          ? `Undo restored ${result.restoredCount}, ${result.failedCount} failed.`
          : `Undo restored ${result.restoredCount} bookmark${result.restoredCount === 1 ? '' : 's'}.`,
      })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to undo delete.',
      })
    }
  }

  const showDeleteUndoToast = (message: string) => {
    showToast({
      tone: 'success',
      message,
      actionLabel: 'Undo',
      onAction: handleUndoDelete,
    })
  }

  const handleAddBookmark = async (values: BookmarkFormValues) => {
    try {
      await createBookmark({
        title: values.title,
        url: values.url,
        parentId: values.parentId,
      })
      setIsBookmarkDialogOpen(false)
      await reloadAfterAction('Bookmark added.')
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to add bookmark.',
      })
    }
  }

  const handleEditBookmark = async (values: BookmarkFormValues) => {
    if (!editingBookmark) {
      return
    }

    try {
      await updateBookmark(editingBookmark.id, {
        title: values.title,
        url: values.url,
      })

      if (values.parentId !== editingBookmark.parentId) {
        await moveBookmark(editingBookmark.id, { parentId: values.parentId })
      }

      setIsBookmarkDialogOpen(false)
      setEditingBookmark(null)
      await reloadAfterAction('Bookmark updated.')
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to update bookmark.',
      })
    }
  }

  const openAddDialog = () => {
    if (!defaultParentId) {
      showToast({
        tone: 'error',
        message: 'No destination folder is available.',
      })
      return
    }

    setBookmarkDialogMode('add')
    setEditingBookmark(null)
    setIsBookmarkDialogOpen(true)
  }

  const openEditDialog = (bookmark: FlatBookmark) => {
    setBookmarkDialogMode('edit')
    setEditingBookmark(bookmark)
    setIsBookmarkDialogOpen(true)
  }

  const handleDeleteBookmark = async (bookmark: FlatBookmark) => {
    const shouldDelete = window.confirm(
      `Delete "${bookmark.title}"?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await saveDeleteUndoState([createDeleteSnapshot(bookmark)], 'delete')
      await removeBookmark(bookmark.id)
      await loadBookmarks()
      showDeleteUndoToast('Bookmark deleted.')
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete bookmark.',
      })
    }
  }

  const summarizeBulkResult = (
    action: string,
    result: PromiseSettledResult<unknown>[],
  ) => {
    const successCount = result.filter((item) => item.status === 'fulfilled').length
    const failureCount = result.length - successCount

    if (failureCount > 0) {
      showToast({
        tone: successCount > 0 ? 'success' : 'error',
        message: `${action}: ${successCount} succeeded, ${failureCount} failed.`,
      })
      return
    }

    showToast({
      tone: 'success',
      message: `${action}: ${successCount} succeeded.`,
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedBookmarks.length === 0) {
      return
    }

    const shouldDelete = window.confirm(
      `Delete ${selectedBookmarks.length} selected bookmark${selectedBookmarks.length === 1 ? '' : 's'}?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      const snapshots = selectedBookmarks.map(createDeleteSnapshot)
      await saveDeleteUndoState(snapshots, 'bulk_delete')

      const result = await Promise.allSettled(
        selectedBookmarks.map((bookmark) => removeBookmark(bookmark.id)),
      )
      const deletedSnapshots = snapshots.filter((_, index) =>
        result[index]?.status === 'fulfilled',
      )
      const successCount = deletedSnapshots.length
      const failureCount = result.length - successCount

      if (successCount > 0) {
        await saveDeleteUndoState(
          deletedSnapshots,
          successCount === 1 ? 'delete' : 'bulk_delete',
        )
      } else {
        await clearDeleteUndoState()
      }

      await loadBookmarks()

      if (successCount > 0) {
        showDeleteUndoToast(
          failureCount > 0
            ? `Delete selected: ${successCount} succeeded, ${failureCount} failed.`
            : `Deleted ${successCount} bookmark${successCount === 1 ? '' : 's'}.`,
        )
        return
      }

      summarizeBulkResult('Delete selected', result)
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error
          ? err.message
          : 'Unable to delete selected bookmarks.',
      })
    }
  }

  const handleDeleteDuplicateGroup = async (group: DuplicateBookmarkGroup) => {
    const keepId = duplicateKeepIds[group.normalizedUrl] ??
      group.bookmarks[0]?.id
    const bookmarksToDelete = group.bookmarks.filter((bookmark) =>
      bookmark.id !== keepId,
    )

    if (bookmarksToDelete.length === 0) {
      return
    }

    const shouldDelete = window.confirm(
      `Delete ${bookmarksToDelete.length} duplicate bookmark${bookmarksToDelete.length === 1 ? '' : 's'} and keep the selected copy?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      const snapshots = bookmarksToDelete.map(createDeleteSnapshot)
      await saveDeleteUndoState(
        snapshots,
        snapshots.length === 1 ? 'delete' : 'bulk_delete',
      )

      const result = await Promise.allSettled(
        bookmarksToDelete.map((bookmark) => removeBookmark(bookmark.id)),
      )
      const deletedSnapshots = snapshots.filter((_, index) =>
        result[index]?.status === 'fulfilled',
      )
      const successCount = deletedSnapshots.length
      const failureCount = result.length - successCount

      if (successCount > 0) {
        await saveDeleteUndoState(
          deletedSnapshots,
          successCount === 1 ? 'delete' : 'bulk_delete',
        )
      } else {
        await clearDeleteUndoState()
      }

      await loadBookmarks()

      if (successCount > 0) {
        showDeleteUndoToast(
          failureCount > 0
            ? `Delete duplicates: ${successCount} succeeded, ${failureCount} failed.`
            : `Deleted ${successCount} duplicate bookmark${successCount === 1 ? '' : 's'}.`,
        )
        return
      }

      summarizeBulkResult('Delete duplicates', result)
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error
          ? err.message
          : 'Unable to delete duplicate bookmarks.',
      })
    }
  }

  const handleMoveSelected = async (parentId: string) => {
    const result = await Promise.allSettled(
      selectedBookmarks.map((bookmark) =>
        moveBookmark(bookmark.id, { parentId }),
      ),
    )

    setIsMoveDialogOpen(false)
    await loadBookmarks()
    summarizeBulkResult('Move selected', result)
  }

  const handleOpenSelected = async () => {
    if (selectedBookmarks.length === 0) {
      return
    }

    const result = await Promise.allSettled(
      selectedBookmarks.map((bookmark) => openBookmarkInTab(bookmark.url)),
    )

    await loadBookmarks()
    summarizeBulkResult('Open selected', result)
  }

  const handleCreateTag = async (name: string, color: string) => {
    try {
      await createTagDefinition({ name, color })
      await loadBookmarks()
      showToast({ tone: 'success', message: 'Tag created.' })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to create tag.',
      })
    }
  }

  const handleUpdateTag = async (
    tagId: string,
    name: string,
    color: string,
  ) => {
    try {
      await updateTagDefinition(tagId, { name, color })
      await loadBookmarks()
      showToast({ tone: 'success', message: 'Tag updated.' })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to update tag.',
      })
    }
  }

  const handleDeleteTag = async (tag: TagDefinition) => {
    const shouldDelete = window.confirm(
      `Delete tag "${tag.name}" and remove it from all bookmarks?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteTagDefinition(tag.id)

      if (selectedTagId === tag.id) {
        setSelectedTagId(null)
      }

      await loadBookmarks()
      showToast({ tone: 'success', message: 'Tag deleted.' })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete tag.',
      })
    }
  }

  const openTagDialogForBookmark = (bookmark: FlatBookmark) => {
    setTagDialogBookmarkIds([bookmark.id])
    setTagDialogInitialTagIds(bookmark.tagIds ?? [])
    setIsTagDialogOpen(true)
  }

  const openTagDialogForSelected = () => {
    if (selectedBookmarks.length === 0) {
      return
    }

    setTagDialogBookmarkIds(selectedBookmarks.map((bookmark) => bookmark.id))
    setTagDialogInitialTagIds(Array.from(
      new Set(selectedBookmarks.flatMap((bookmark) => bookmark.tagIds ?? [])),
    ))
    setIsTagDialogOpen(true)
  }

  const handleApplyTags = async (tagIds: string[]) => {
    try {
      await setTagsForBookmarks(tagDialogBookmarkIds, tagIds)
      setIsTagDialogOpen(false)
      await loadBookmarks()
      showToast({
        tone: 'success',
        message: `Tags updated for ${tagDialogBookmarkIds.length} bookmark${tagDialogBookmarkIds.length === 1 ? '' : 's'}.`,
      })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to update tags.',
      })
    }
  }

  const handleRemoveTagFromBookmark = async (
    bookmarkId: string,
    tagId: string,
  ) => {
    try {
      await removeTagFromBookmark(bookmarkId, tagId)
      await loadBookmarks()
      showToast({ tone: 'success', message: 'Tag removed from bookmark.' })
    } catch (err) {
      showToast({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to remove tag.',
      })
    }
  }

  return (
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFolders((value) => !value)}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)] md:hidden"
            >
              {showFolders ? 'Hide folders' : 'Show folders'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('bookmarks')
                setIsReviewingDuplicates(false)
              }}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                activeView === 'bookmarks'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              Bookmarks
            </button>
            <button
              type="button"
              onClick={() => setActiveView('cleanup')}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                activeView === 'cleanup'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              Cleanup
            </button>
            <button
              type="button"
              onClick={openAddDialog}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={loadBookmarks}
              className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="mt-4 grid gap-4 md:grid-cols-[240px,1fr]">
          {showFolders ? (
            <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  Folders
                </p>
                {isLoading ? (
                  <span className="h-2 w-10 animate-pulse rounded bg-[var(--color-accent-soft)]" />
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition ${
                    selectedFolderId === null
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-title)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[10px] text-[var(--color-accent)]">
                      <span className="library-glyph" />
                    </span>
                    <span className="truncate">All Bookmarks</span>
                  </span>
                  <span className="rounded-md bg-[var(--color-input)] px-1.5 py-0.5 text-xs font-semibold">
                    {bookmarks.length}
                  </span>
                </button>
                {isLoading ? (
                  <FolderSkeleton />
                ) : error ? (
                  <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    Folder tree is unavailable.
                  </p>
                ) : (
                  <FolderTree
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                  />
                )}
              </div>
              <TagPanel
                tags={tags}
                selectedTagId={selectedTagId}
                tagCounts={tagCounts}
                onSelectTag={setSelectedTagId}
                onCreateTag={handleCreateTag}
                onUpdateTag={handleUpdateTag}
                onDeleteTag={handleDeleteTag}
              />
            </aside>
          ) : null}

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[var(--shadow-soft)]">
            {activeView === 'cleanup' ? (
              <CleanupDashboard
                stats={cleanupStats}
                isReviewingDuplicates={isReviewingDuplicates}
                duplicateKeepIds={duplicateKeepIds}
                onReviewDuplicates={() => setIsReviewingDuplicates(true)}
                onBackToDashboard={() => setIsReviewingDuplicates(false)}
                onReviewUntitled={() => {
                  setActiveView('bookmarks')
                  setQuickFilter('untitled')
                  setSelectedTagId(null)
                }}
                onReviewUntagged={() => {
                  setActiveView('bookmarks')
                  setQuickFilter('untagged')
                  setSelectedTagId(null)
                }}
                onSelectDuplicateKeep={(groupKey, bookmarkId) =>
                  setDuplicateKeepIds((current) => ({
                    ...current,
                    [groupKey]: bookmarkId,
                  }))}
                onDeleteDuplicateGroup={handleDeleteDuplicateGroup}
              />
            ) : (
              <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {listTitle}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {isLoading ? 'Loading bookmarks...' : `${filteredBookmarks.length} items`}
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-muted)] focus-within:border-[var(--color-accent)]">
                <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-semibold">/</span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search bookmarks"
                  className="w-44 bg-transparent text-sm text-[var(--color-title)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(Object.keys(quickFilterLabels) as QuickFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setQuickFilter(filter)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    quickFilter === filter
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  {quickFilterLabels[filter]}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {isLoading ? (
                <LoadingList />
              ) : error ? (
                <ErrorState message={error} onRetry={loadBookmarks} />
              ) : filteredBookmarks.length === 0 ? (
                <EmptyState isLibraryEmpty={isEmptyLibrary} />
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2">
                    <p className="text-xs font-semibold text-[var(--color-muted)]">
                      {selectedCount > 0
                        ? `${selectedCount} selected`
                        : 'Select bookmarks for bulk actions'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVisibleSelection}
                        className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-accent-soft)]"
                      >
                        {areAllVisibleSelected ? 'Unselect visible' : 'Select visible'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={selectedCount === 0}
                        className="rounded-md bg-[var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Delete selected
                      </button>
                    </div>
                  </div>
                  <BookmarkList
                    bookmarks={filteredBookmarks}
                    tagsById={tagsById}
                    selectedBookmarkIds={selectedBookmarkIds}
                    onToggleBookmark={toggleBookmarkSelection}
                    onEditBookmark={openEditDialog}
                    onDeleteBookmark={handleDeleteBookmark}
                    onOpenTagDialog={openTagDialogForBookmark}
                    onRemoveTag={handleRemoveTagFromBookmark}
                  />
                </>
              )}
            </div>
            <BulkActionBar
              selectedCount={selectedCount}
              visibleCount={filteredBookmarks.length}
              areAllVisibleSelected={areAllVisibleSelected}
              onSelectVisible={toggleVisibleSelection}
              onClearSelection={() => setSelectedBookmarkIds(new Set())}
              onOpenSelected={handleOpenSelected}
              onMoveSelected={() => {
                if (!defaultParentId) {
                  showToast({
                    tone: 'error',
                    message: 'No destination folder is available.',
                  })
                  return
                }

                setIsMoveDialogOpen(true)
              }}
              onTagSelected={openTagDialogForSelected}
              onDeleteSelected={handleDeleteSelected}
            />
              </>
            )}
          </section>
        </div>
      </div>
      <BookmarkDialog
        mode={bookmarkDialogMode}
        bookmark={editingBookmark}
        folderOptions={folderOptions}
        defaultParentId={defaultParentId}
        isOpen={isBookmarkDialogOpen}
        onClose={() => {
          setIsBookmarkDialogOpen(false)
          setEditingBookmark(null)
        }}
        onSubmit={bookmarkDialogMode === 'add'
          ? handleAddBookmark
          : handleEditBookmark}
      />
      <MoveBookmarksDialog
        isOpen={isMoveDialogOpen}
        selectedCount={selectedCount}
        folderOptions={folderOptions}
        defaultParentId={defaultParentId}
        onClose={() => setIsMoveDialogOpen(false)}
        onMove={handleMoveSelected}
      />
      <TagAssignmentDialog
        isOpen={isTagDialogOpen}
        tags={tags}
        targetCount={tagDialogBookmarkIds.length}
        initialTagIds={tagDialogInitialTagIds}
        onClose={() => setIsTagDialogOpen(false)}
        onApply={handleApplyTags}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

const findFolder = (
  folders: BookmarkFolder[],
  folderId: string,
): BookmarkFolder | null => {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder
    }

    const match = findFolder(folder.children, folderId)

    if (match) {
      return match
    }
  }

  return null
}

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
        <span className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]">
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
    <div className="space-y-2">
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
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[10px] text-[var(--color-warning)]">
                <span className="folder-glyph" />
              </span>
              <span className="truncate">{folder.title}</span>
            </span>
            <span className="rounded-md bg-[var(--color-input)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
              {folder.bookmarkCount}
            </span>
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

const LoadingList = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-3"
        >
          <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-accent-soft)]" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-[var(--color-accent-soft)]" />
        </div>
      ))}
    </div>
  )
}

type EmptyStateProps = {
  isLibraryEmpty: boolean
}

const EmptyState = ({ isLibraryEmpty }: EmptyStateProps) => (
  <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-10 text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
      <span className="library-glyph scale-125" />
    </span>
    <p className="mt-3 text-sm font-semibold text-[var(--color-title)]">
      {isLibraryEmpty ? 'No bookmarks yet' : 'This folder has no bookmarks'}
    </p>
    <p className="mt-2 text-xs text-[var(--color-muted)]">
      {isLibraryEmpty
        ? 'Add bookmarks in Chrome or Edge, then refresh MarkPilot.'
        : 'Pick another folder or return to All Bookmarks.'}
    </p>
  </div>
)

type ErrorStateProps = {
  message: string
  onRetry: () => void
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
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
