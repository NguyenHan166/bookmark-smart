import type { FlatBookmark } from '../types/bookmarks'

export type QuickFilter = 'all' | 'untitled' | 'untagged'
export type BookmarkSort = 'date-desc' | 'date-asc' | 'title-asc' | 'domain-asc'

export const quickFilterLabels: Record<QuickFilter, string> = {
  all: 'All',
  untitled: 'Untitled',
  untagged: 'Untagged',
}

type BookmarkFilterInput = {
  bookmarks: FlatBookmark[]
  folderId: string | null
  tagId: string | null
  domain: string
  sameDomainOnly: boolean
  searchQuery: string
  quickFilter: QuickFilter
  sort: BookmarkSort
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
  domain,
  sameDomainOnly,
  searchQuery,
  quickFilter,
  sort,
}: BookmarkFilterInput) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const normalizedDomain = domain.trim().toLowerCase()
  const domainCounts = bookmarks.reduce<Record<string, number>>(
    (counts, bookmark) => {
      const key = bookmark.domain.toLowerCase()
      counts[key] = (counts[key] ?? 0) + 1

      return counts
    },
    {},
  )

  const filtered = bookmarks.filter((bookmark) => {
    const isInFolder = folderId
      ? bookmark.folderPathIds.includes(folderId)
      : true
    const hasSelectedTag = tagId
      ? Boolean(bookmark.tagIds?.includes(tagId))
      : true
    const matchesDomain = normalizedDomain
      ? bookmark.domain.toLowerCase() === normalizedDomain
      : true
    const hasSameDomain = sameDomainOnly
      ? (domainCounts[bookmark.domain.toLowerCase()] ?? 0) > 1
      : true

    return (
      isInFolder &&
      hasSelectedTag &&
      matchesDomain &&
      hasSameDomain &&
      matchesQuickFilter(bookmark, quickFilter) &&
      includesSearchQuery(bookmark, normalizedQuery)
    )
  })

  return [...filtered].sort((left, right) => {
    if (sort === 'title-asc') {
      return left.title.localeCompare(right.title)
    }

    if (sort === 'domain-asc') {
      const domainCompare = left.domain.localeCompare(right.domain)

      return domainCompare || left.title.localeCompare(right.title)
    }

    const leftDate = left.dateAdded ?? 0
    const rightDate = right.dateAdded ?? 0

    if (sort === 'date-asc') {
      return leftDate - rightDate
    }

    return rightDate - leftDate
  })
}
