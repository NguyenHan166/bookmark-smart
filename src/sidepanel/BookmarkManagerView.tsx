import type { RefObject } from 'react'
import type { FlatBookmark, TagDefinition } from '../types/bookmarks'
import { BookmarkList, BulkActionBar } from './BookmarkList'
import { BookmarkToolbar } from './BookmarkToolbar'
import type { QuickFilter } from './bookmark-filters'
import { EmptyState, ErrorState, LoadingList } from './StatusStates'

type BookmarkManagerViewProps = {
  title: string
  itemCountLabel: string
  bookmarks: FlatBookmark[]
  tagsById: Record<string, TagDefinition>
  selectedBookmarkIds: Set<string>
  searchQuery: string
  quickFilter: QuickFilter
  selectedCount: number
  areAllVisibleSelected: boolean
  isLoading: boolean
  error: string | null
  isEmptyLibrary: boolean
  hasActiveFilters: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onSearchChange: (value: string) => void
  onQuickFilterChange: (filter: QuickFilter) => void
  onToggleVisibleSelection: () => void
  onDeleteSelected: () => void
  onClearSelection: () => void
  onOpenSelected: () => void
  onMoveSelected: () => void
  onTagSelected: () => void
  onToggleBookmark: (bookmarkId: string) => void
  onOpenBookmark: (bookmark: FlatBookmark) => void
  onEditBookmark: (bookmark: FlatBookmark) => void
  onDeleteBookmark: (bookmark: FlatBookmark) => void
  onOpenTagDialog: (bookmark: FlatBookmark) => void
  onRemoveTag: (bookmarkId: string, tagId: string) => void
  onRetry: () => void
}

export const BookmarkManagerView = ({
  title,
  itemCountLabel,
  bookmarks,
  tagsById,
  selectedBookmarkIds,
  searchQuery,
  quickFilter,
  selectedCount,
  areAllVisibleSelected,
  isLoading,
  error,
  isEmptyLibrary,
  hasActiveFilters,
  searchInputRef,
  onSearchChange,
  onQuickFilterChange,
  onToggleVisibleSelection,
  onDeleteSelected,
  onClearSelection,
  onOpenSelected,
  onMoveSelected,
  onTagSelected,
  onToggleBookmark,
  onOpenBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onOpenTagDialog,
  onRemoveTag,
  onRetry,
}: BookmarkManagerViewProps) => (
  <>
    <BookmarkToolbar
      title={title}
      itemCountLabel={itemCountLabel}
      searchQuery={searchQuery}
      quickFilter={quickFilter}
      selectedCount={selectedCount}
      areAllVisibleSelected={areAllVisibleSelected}
      searchInputRef={searchInputRef}
      onSearchChange={onSearchChange}
      onQuickFilterChange={onQuickFilterChange}
      onToggleVisibleSelection={onToggleVisibleSelection}
      onDeleteSelected={onDeleteSelected}
    />

    <div className="mt-4 pb-20">
      {isLoading ? (
        <LoadingList />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          isLibraryEmpty={isEmptyLibrary}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          tagsById={tagsById}
          selectedBookmarkIds={selectedBookmarkIds}
          onToggleBookmark={onToggleBookmark}
          onOpenBookmark={onOpenBookmark}
          onEditBookmark={onEditBookmark}
          onDeleteBookmark={onDeleteBookmark}
          onOpenTagDialog={onOpenTagDialog}
          onRemoveTag={onRemoveTag}
        />
      )}
    </div>

    <BulkActionBar
      selectedCount={selectedCount}
      visibleCount={bookmarks.length}
      areAllVisibleSelected={areAllVisibleSelected}
      onSelectVisible={onToggleVisibleSelection}
      onClearSelection={onClearSelection}
      onOpenSelected={onOpenSelected}
      onMoveSelected={onMoveSelected}
      onTagSelected={onTagSelected}
      onDeleteSelected={onDeleteSelected}
    />
  </>
)
