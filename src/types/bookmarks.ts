export interface FlatBookmark {
  id: string
  title: string
  url: string
  parentId?: string
  index?: number
  folderPath: string[]
  folderPathIds: string[]
  domain: string
  normalizedUrl: string
  dateAdded?: number
  isUntitled: boolean
  tagIds?: string[]
  note?: string
  isPinned?: boolean
}

export interface BookmarkFolder {
  id: string
  title: string
  parentId?: string
  path: string[]
  bookmarkCount: number
  children: BookmarkFolder[]
}

export interface BookmarkMetadata {
  bookmarkId: string
  tags: string[]
  category?: string
  note?: string
  favorite?: boolean
  lastReviewedAt?: number
  createdByRuleIds?: string[]
}

export interface MetadataStore {
  version: 1
  bookmarks: Record<string, BookmarkMetadata>
}

export interface DeletedBookmarkSnapshot {
  id: string
  title: string
  url: string
  parentId?: string
  index?: number
  metadata?: BookmarkMetadata
}

export interface UndoState {
  type: 'delete' | 'bulk_delete'
  createdAt: number
  items: DeletedBookmarkSnapshot[]
}

export interface TagDefinition {
  id: string
  name: string
  color?: string
  createdAt: number
}

export interface TagStore {
  version: 1
  tags: Record<string, TagDefinition>
}
