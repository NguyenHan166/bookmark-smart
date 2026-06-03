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
import { AppShell, type SidePanelView } from './AppShell'
import {
  BookmarkDialog,
  type BookmarkFormValues,
} from './BookmarkDialog'
import { BookmarkManagerView } from './BookmarkManagerView'
import { CleanupDashboard } from './CleanupDashboard'
import { MoveBookmarksDialog } from './MoveBookmarksDialog'
import { Sidebar } from './Sidebar'
import { TagAssignmentDialog } from './TagAssignmentDialog'
import { Toast, type ToastState } from './Toast'
import {
  filterBookmarks,
  type QuickFilter,
} from './bookmark-filters'
import { getCleanupStats, type DuplicateBookmarkGroup } from './cleanup-utils'
import { getFolderOptions } from './folder-options'

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
  const hasActiveFilters = Boolean(
    searchQuery.trim() || quickFilter !== 'all' || selectedTagId,
  )
  const itemCountLabel = isLoading
    ? 'Loading bookmarks...'
    : `${filteredBookmarks.length} item${filteredBookmarks.length === 1 ? '' : 's'}`

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
    <>
      <AppShell
        activeView={activeView}
        showSidebar={showFolders}
        onToggleSidebar={() => setShowFolders((value) => !value)}
        onChangeView={(view) => {
          setActiveView(view)
          if (view === 'bookmarks') {
            setIsReviewingDuplicates(false)
          }
        }}
        onAddBookmark={openAddDialog}
        onRefresh={loadBookmarks}
        sidebar={(
          <Sidebar
            bookmarksCount={bookmarks.length}
            folders={folders}
            tags={tags}
            tagCounts={tagCounts}
            selectedFolderId={selectedFolderId}
            selectedTagId={selectedTagId}
            isLoading={isLoading}
            hasError={Boolean(error)}
            onSelectFolder={setSelectedFolderId}
            onSelectTag={setSelectedTagId}
            onCreateTag={handleCreateTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
          />
        )}
      >
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
          <BookmarkManagerView
            title={listTitle}
            itemCountLabel={itemCountLabel}
            bookmarks={filteredBookmarks}
            tagsById={tagsById}
            selectedBookmarkIds={selectedBookmarkIds}
            searchQuery={searchQuery}
            quickFilter={quickFilter}
            selectedCount={selectedCount}
            areAllVisibleSelected={areAllVisibleSelected}
            isLoading={isLoading}
            error={error}
            isEmptyLibrary={isEmptyLibrary}
            hasActiveFilters={hasActiveFilters}
            searchInputRef={searchInputRef}
            onSearchChange={setSearchQuery}
            onQuickFilterChange={setQuickFilter}
            onToggleVisibleSelection={toggleVisibleSelection}
            onDeleteSelected={handleDeleteSelected}
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
            onToggleBookmark={toggleBookmarkSelection}
            onEditBookmark={openEditDialog}
            onDeleteBookmark={handleDeleteBookmark}
            onOpenTagDialog={openTagDialogForBookmark}
            onRemoveTag={handleRemoveTagFromBookmark}
            onRetry={loadBookmarks}
          />
        )}
      </AppShell>
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
    </>
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
