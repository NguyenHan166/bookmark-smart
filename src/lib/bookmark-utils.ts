import type { BookmarkFolder, FlatBookmark } from '../types/bookmarks'

const normalizeHostname = (hostname: string) => {
  const lowered = hostname.toLowerCase()
  return lowered.startsWith('www.') ? lowered.slice(4) : lowered
}

export const normalizeUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    parsed.hash = ''

    if (parsed.pathname.endsWith('/') && parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    parsed.hostname = normalizeHostname(parsed.hostname)

    return parsed.toString()
  } catch {
    return url
  }
}

export const getDomain = (url: string) => {
  try {
    const parsed = new URL(url)
    return normalizeHostname(parsed.hostname)
  } catch {
    return 'unknown'
  }
}

export const flattenBookmarks = (
  nodes: chrome.bookmarks.BookmarkTreeNode[],
): FlatBookmark[] => {
  const root = nodes[0]

  if (!root) {
    return []
  }

  const bookmarks: FlatBookmark[] = []

  const walk = (
    node: chrome.bookmarks.BookmarkTreeNode,
    path: string[],
    pathIds: string[],
  ) => {
    if (node.url) {
      const isUntitled = !node.title?.trim()
      const title = isUntitled ? '(No title)' : node.title
      const domain = getDomain(node.url)

      bookmarks.push({
        id: node.id,
        title,
        url: node.url,
        parentId: node.parentId,
        index: node.index,
        folderPath: path,
        folderPathIds: pathIds,
        domain,
        normalizedUrl: normalizeUrl(node.url),
        dateAdded: node.dateAdded,
        isUntitled,
      })
      return
    }

    if (!node.children) {
      return
    }

    const folderTitle = node.title?.trim() || 'Untitled'
    const nextPath = node.id === root.id ? path : [...path, folderTitle]
    const nextPathIds = node.id === root.id ? pathIds : [...pathIds, node.id]

    node.children.forEach((child) => walk(child, nextPath, nextPathIds))
  }

  walk(root, [], [])

  return bookmarks
}

export const buildFolderTree = (
  nodes: chrome.bookmarks.BookmarkTreeNode[],
): BookmarkFolder[] => {
  const root = nodes[0]

  if (!root?.children) {
    return []
  }

  const build = (
    node: chrome.bookmarks.BookmarkTreeNode,
    path: string[],
  ): BookmarkFolder | null => {
    if (!node.children) {
      return null
    }

    const title = node.title?.trim() || 'Untitled'
    const nextPath = node.id === root.id ? path : [...path, title]
    let bookmarkCount = 0
    const children = node.children
      .map((child) => {
        if (child.url) {
          bookmarkCount += 1
          return null
        }

        return build(child, nextPath)
      })
      .filter((child): child is BookmarkFolder => Boolean(child))

    bookmarkCount += children.reduce(
      (total, child) => total + child.bookmarkCount,
      0,
    )

    return {
      id: node.id,
      title: node.id === root.id ? 'All Bookmarks' : title,
      parentId: node.parentId,
      path: nextPath,
      bookmarkCount,
      children,
    }
  }

  const rootFolder = build(root, [])

  return rootFolder ? rootFolder.children : []
}
