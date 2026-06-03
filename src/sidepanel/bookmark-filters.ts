import type { FlatBookmark } from '../types/bookmarks'

export type QuickFilter = 'all' | 'untitled' | 'untagged'

export const quickFilterLabels: Record<QuickFilter, string> = {
  all: 'All',
  untitled: 'Untitled',
  untagged: 'Untagged',
}

type BookmarkFilterInput = {
  bookmarks: FlatBookmark[]
  folderId: string | null
  tagId: string | null
  searchQuery: string
  quickFilter: QuickFilter
}

const includesSearchQuery = (bookmark: FlatBookmark, query: string) => {
  if (!query) {
    return true
  }

  const searchableText = [
    bookmark.title,
    bookmark.url,
    bookmark.domain,
    bookmark.folderPath.join(' '),
    bookmark.folderPath.join(' / '),
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(query)
}

const matchesQuickFilter = (
  bookmark: FlatBookmark,
  quickFilter: QuickFilter,
) => {
  if (quickFilter === 'untitled') {
    return bookmark.isUntitled
  }

  if (quickFilter === 'untagged') {
    return !bookmark.tagIds?.length
  }

  return true
}

export const filterBookmarks = ({
  bookmarks,
  folderId,
  tagId,
  searchQuery,
  quickFilter,
}: BookmarkFilterInput) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return bookmarks.filter((bookmark) => {
    const isInFolder = folderId
      ? bookmark.folderPathIds.includes(folderId)
      : true
    const hasSelectedTag = tagId
      ? Boolean(bookmark.tagIds?.includes(tagId))
      : true

    return (
      isInFolder &&
      hasSelectedTag &&
      matchesQuickFilter(bookmark, quickFilter) &&
      includesSearchQuery(bookmark, normalizedQuery)
    )
  })
}
