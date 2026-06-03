import type {
  DeletedBookmarkSnapshot,
  TagDefinition,
  TagStore,
  MetadataStore,
  UndoState,
} from '../types/bookmarks'

const STORAGE_KEYS = {
  metadata: 'markpilot.metadata.v1',
  tags: 'markpilot.tags.v1',
  undo: 'markpilot.undo.v1',
} as const

type TagDefinitionInput = {
  name: string
  color?: string
}

const getChrome = () => {
  if (typeof chrome === 'undefined') {
    return null
  }

  return chrome
}

export const isChromeBookmarksAvailable = () => {
  return Boolean(getChrome()?.bookmarks)
}

const getStorageLocal = () => {
  const api = getChrome()

  if (!api?.storage?.local) {
    throw new Error('Chrome storage API is not available in this context.')
  }

  return api.storage.local
}

export const getBookmarkTree = async () => {
  const api = getChrome()

  if (!api?.bookmarks) {
    throw new Error('Chrome bookmarks API is not available in this context.')
  }

  return api.bookmarks.getTree()
}

export const createBookmark = async (
  input: chrome.bookmarks.CreateDetails,
) => {
  const api = getChrome()

  if (!api?.bookmarks) {
    throw new Error('Chrome bookmarks API is not available in this context.')
  }

  return api.bookmarks.create(input)
}

export const updateBookmark = async (
  id: string,
  changes: chrome.bookmarks.UpdateChanges,
) => {
  const api = getChrome()

  if (!api?.bookmarks) {
    throw new Error('Chrome bookmarks API is not available in this context.')
  }

  return api.bookmarks.update(id, changes)
}

export const moveBookmark = async (
  id: string,
  destination: chrome.bookmarks.MoveDestination,
) => {
  const api = getChrome()

  if (!api?.bookmarks) {
    throw new Error('Chrome bookmarks API is not available in this context.')
  }

  return api.bookmarks.move(id, destination)
}

export const removeBookmark = async (id: string) => {
  const api = getChrome()

  if (!api?.bookmarks) {
    throw new Error('Chrome bookmarks API is not available in this context.')
  }

  return api.bookmarks.remove(id)
}

export const getMetadataStore = async (): Promise<MetadataStore> => {
  const storage = getStorageLocal()
  const data = await storage.get(STORAGE_KEYS.metadata)
  const store = data[STORAGE_KEYS.metadata] as MetadataStore | undefined

  return store ?? {
    version: 1,
    bookmarks: {},
  }
}

export const setMetadataStore = async (store: MetadataStore) => {
  const storage = getStorageLocal()

  await storage.set({
    [STORAGE_KEYS.metadata]: store,
  })
}

export const getTagStore = async (): Promise<TagStore> => {
  const storage = getStorageLocal()
  const data = await storage.get(STORAGE_KEYS.tags)
  const store = data[STORAGE_KEYS.tags] as TagStore | undefined

  return store ?? {
    version: 1,
    tags: {},
  }
}

export const setTagStore = async (store: TagStore) => {
  const storage = getStorageLocal()

  await storage.set({
    [STORAGE_KEYS.tags]: store,
  })
}

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const createTagDefinition = async ({
  name,
  color,
}: TagDefinitionInput) => {
  const store = await getTagStore()
  const tag: TagDefinition = {
    id: createId(),
    name,
    color,
    createdAt: Date.now(),
  }

  await setTagStore({
    ...store,
    tags: {
      ...store.tags,
      [tag.id]: tag,
    },
  })

  return tag
}

export const updateTagDefinition = async (
  tagId: string,
  changes: TagDefinitionInput,
) => {
  const store = await getTagStore()
  const existing = store.tags[tagId]

  if (!existing) {
    throw new Error('Tag not found.')
  }

  const updated: TagDefinition = {
    ...existing,
    name: changes.name,
    color: changes.color,
  }

  await setTagStore({
    ...store,
    tags: {
      ...store.tags,
      [tagId]: updated,
    },
  })

  return updated
}

export const deleteTagDefinition = async (tagId: string) => {
  const tagStore = await getTagStore()
  const metadataStore = await getMetadataStore()
  const remainingTags = { ...tagStore.tags }
  delete remainingTags[tagId]
  const nextBookmarks = Object.fromEntries(
    Object.entries(metadataStore.bookmarks)
      .map(([bookmarkId, metadata]) => [
        bookmarkId,
        {
          ...metadata,
          tags: metadata.tags.filter((item) => item !== tagId),
        },
      ])
      .filter(([, metadata]) =>
        shouldKeepMetadata(metadata as MetadataStore['bookmarks'][string]),
      ),
  ) as MetadataStore['bookmarks']

  await setTagStore({
    ...tagStore,
    tags: remainingTags,
  })
  await setMetadataStore({
    ...metadataStore,
    bookmarks: nextBookmarks,
  })
}

export const assignTagsToBookmarks = async (
  bookmarkIds: string[],
  tagIds: string[],
) => {
  const metadataStore = await getMetadataStore()
  const uniqueTagIds = Array.from(new Set(tagIds))

  await setMetadataStore({
    ...metadataStore,
    bookmarks: {
      ...metadataStore.bookmarks,
      ...Object.fromEntries(
        bookmarkIds.map((bookmarkId) => {
          const existing = metadataStore.bookmarks[bookmarkId]
          const tags = Array.from(
            new Set([...(existing?.tags ?? []), ...uniqueTagIds]),
          )

          return [
            bookmarkId,
            {
              ...existing,
              bookmarkId,
              tags,
            },
          ]
        }),
      ),
    },
  })
}

export const setTagsForBookmarks = async (
  bookmarkIds: string[],
  tagIds: string[],
) => {
  const metadataStore = await getMetadataStore()
  const uniqueTagIds = Array.from(new Set(tagIds))

  await setMetadataStore({
    ...metadataStore,
    bookmarks: {
      ...metadataStore.bookmarks,
      ...Object.fromEntries(
        bookmarkIds.map((bookmarkId) => {
          const existing = metadataStore.bookmarks[bookmarkId]

          return [
            bookmarkId,
            {
              ...existing,
              bookmarkId,
              tags: uniqueTagIds,
            },
          ]
        }),
      ),
    },
  })
}

const shouldKeepMetadata = (
  metadata: MetadataStore['bookmarks'][string],
) => {
  return (
    metadata.tags.length > 0 ||
    Boolean(metadata.category) ||
    Boolean(metadata.note) ||
    Boolean(metadata.favorite) ||
    Boolean(metadata.lastReviewedAt) ||
    Boolean(metadata.createdByRuleIds?.length)
  )
}

export const removeTagFromBookmark = async (
  bookmarkId: string,
  tagId: string,
) => {
  const metadataStore = await getMetadataStore()
  const existing = metadataStore.bookmarks[bookmarkId]

  if (!existing) {
    return
  }

  const tags = existing.tags.filter((item) => item !== tagId)
  const bookmarks = { ...metadataStore.bookmarks }
  const nextMetadata = {
    ...existing,
    tags,
  }

  if (shouldKeepMetadata(nextMetadata)) {
    bookmarks[bookmarkId] = nextMetadata
  } else {
    delete bookmarks[bookmarkId]
  }

  await setMetadataStore({
    ...metadataStore,
    bookmarks,
  })
}

export const saveDeleteUndoState = async (
  inputItems: DeletedBookmarkSnapshot[],
  type: UndoState['type'],
) => {
  const storage = getStorageLocal()
  const metadataStore = await getMetadataStore()
  const items = inputItems.map((item) => ({
    ...item,
    metadata: metadataStore.bookmarks[item.id],
  }))
  const undoState: UndoState = {
    type,
    createdAt: Date.now(),
    items,
  }

  await storage.set({
    [STORAGE_KEYS.undo]: undoState,
  })
}

export const clearDeleteUndoState = async () => {
  const storage = getStorageLocal()

  await storage.remove(STORAGE_KEYS.undo)
}

export const restoreLastDeletedBookmarks = async () => {
  const storage = getStorageLocal()
  const data = await storage.get(STORAGE_KEYS.undo)
  const undoState = data[STORAGE_KEYS.undo] as UndoState | undefined

  if (!undoState?.items.length) {
    throw new Error('No deleted bookmarks are available to restore.')
  }

  const metadataStore = await getMetadataStore()
  const sortedItems = [...undoState.items].sort((left, right) => {
    if (left.parentId !== right.parentId) {
      return (left.parentId ?? '').localeCompare(right.parentId ?? '')
    }

    return (left.index ?? Number.MAX_SAFE_INTEGER) -
      (right.index ?? Number.MAX_SAFE_INTEGER)
  })
  const result: PromiseSettledResult<chrome.bookmarks.BookmarkTreeNode>[] = []

  for (const item of sortedItems) {
    try {
      const restored = await createBookmark({
        title: item.title,
        url: item.url,
        parentId: item.parentId,
        index: item.index,
      })

      if (item.metadata) {
        delete metadataStore.bookmarks[item.id]

        metadataStore.bookmarks = {
          ...metadataStore.bookmarks,
          [restored.id]: {
            ...item.metadata,
            bookmarkId: restored.id,
          },
        }
      }

      result.push({ status: 'fulfilled', value: restored })
    } catch (reason) {
      result.push({ status: 'rejected', reason })
    }
  }

  const restoredCount = result.filter((item) => item.status === 'fulfilled').length
  const failedCount = result.length - restoredCount

  if (restoredCount > 0) {
    await setMetadataStore(metadataStore)
  }

  if (failedCount === 0) {
    await clearDeleteUndoState()
  }

  return {
    restoredCount,
    failedCount,
  }
}

export const openBookmarkInTab = async (url: string) => {
  const api = getChrome()

  if (!api?.tabs) {
    throw new Error('Chrome tabs API is not available in this context.')
  }

  return api.tabs.create({ url, active: false })
}

export const openSidePanel = async () => {
  const api = getChrome()

  if (!api?.sidePanel) {
    throw new Error('Side panel API is not available in this browser.')
  }

  const [tab] = await api.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })

  if (!tab?.windowId) {
    throw new Error('No active window found to open the side panel.')
  }

  await api.sidePanel.open({ windowId: tab.windowId })
}
