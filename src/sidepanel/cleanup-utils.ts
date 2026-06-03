import type { FlatBookmark } from '../types/bookmarks'

export type DuplicateBookmarkGroup = {
  normalizedUrl: string
  bookmarks: FlatBookmark[]
}

export type CleanupStats = {
  duplicateGroups: DuplicateBookmarkGroup[]
  duplicateBookmarkCount: number
  untitledBookmarks: FlatBookmark[]
  untaggedBookmarks: FlatBookmark[]
}

export const getCleanupStats = (bookmarks: FlatBookmark[]): CleanupStats => {
  const byNormalizedUrl = bookmarks.reduce<Record<string, FlatBookmark[]>>(
    (groups, bookmark) => {
      groups[bookmark.normalizedUrl] = [
        ...(groups[bookmark.normalizedUrl] ?? []),
        bookmark,
      ]

      return groups
    },
    {},
  )
  const duplicateGroups = Object.entries(byNormalizedUrl)
    .filter(([, items]) => items.length > 1)
    .map(([normalizedUrl, items]) => ({
      normalizedUrl,
      bookmarks: items.sort((left, right) =>
        (left.dateAdded ?? 0) - (right.dateAdded ?? 0),
      ),
    }))
    .sort((left, right) => right.bookmarks.length - left.bookmarks.length)

  return {
    duplicateGroups,
    duplicateBookmarkCount: duplicateGroups.reduce(
      (total, group) => total + group.bookmarks.length,
      0,
    ),
    untitledBookmarks: bookmarks.filter((bookmark) => bookmark.isUntitled),
    untaggedBookmarks: bookmarks.filter((bookmark) => !bookmark.tagIds?.length),
  }
}
