import type { RefObject } from 'react'
import type { FlatBookmark, TagDefinition } from '../types/bookmarks'
import { BookmarkList, BulkActionBar } from './BookmarkList'
import { BookmarkToolbar } from './BookmarkToolbar'
import type { BookmarkSort, QuickFilter } from './bookmark-filters'
import type { FolderOption } from './folder-options'
import { EmptyState, ErrorState, LoadingList } from './StatusStates'

type BookmarkManagerViewProps = {
  title: string
  itemCountLabel: string
  bookmarks: FlatBookmark[]
  tagsById: Record<string, TagDefinition>
  selectedBookmarkIds: Set<string>
  searchQuery: string
  quickFilter: QuickFilter
  folderId: string | null
  tagId: string | null
  domain: string
  sameDomainOnly: boolean
  sort: BookmarkSort
  folderOptions: FolderOption[]
  tags: TagDefinition[]
  domainOptions: string[]
  selectedCount: number
  areAllVisibleSelected: boolean
  isLoading: boolean
  error: string | null
  isEmptyLibrary: boolean
  hasActiveFilters: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  onSearchChange: (value: string) => void
  onQuickFilterChange: (filter: QuickFilter) => void
  onFolderChange: (folderId: string | null) => void
  onTagChange: (tagId: string | null) => void
  onDomainChange: (domain: string) => void
  onSameDomainOnlyChange: (enabled: boolean) => void
  onSortChange: (sort: BookmarkSort) => void
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
  folderId,
  tagId,
  domain,
  sameDomainOnly,
  sort,
  folderOptions,
  tags,
  domainOptions,
  selectedCount,
  areAllVisibleSelected,
  isLoading,
  error,
  isEmptyLibrary,
  hasActiveFilters,
  searchInputRef,
  onSearchChange,
  onQuickFilterChange,
  onFolderChange,
  onTagChange,
  onDomainChange,
  onSameDomainOnlyChange,
  onSortChange,
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
      folderId={folderId}
      tagId={tagId}
      domain={domain}
      sameDomainOnly={sameDomainOnly}
      sort={sort}
      folderOptions={folderOptions}
      tags={tags}
      domainOptions={domainOptions}
      selectedCount={selectedCount}
      areAllVisibleSelected={areAllVisibleSelected}
      searchInputRef={searchInputRef}
      onSearchChange={onSearchChange}
      onQuickFilterChange={onQuickFilterChange}
      onFolderChange={onFolderChange}
      onTagChange={onTagChange}
      onDomainChange={onDomainChange}
      onSameDomainOnlyChange={onSameDomainOnlyChange}
      onSortChange={onSortChange}
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
