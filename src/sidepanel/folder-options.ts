import type { BookmarkFolder } from '../types/bookmarks'

export type FolderOption = {
  id: string
  title: string
  label: string
}

export const getFolderOptions = (folders: BookmarkFolder[]) => {
  const options: FolderOption[] = []

  const walk = (items: BookmarkFolder[]) => {
    items.forEach((folder) => {
      options.push({
        id: folder.id,
        title: folder.title,
        label: folder.path.length > 0
          ? folder.path.join(' / ')
          : folder.title,
      })

      walk(folder.children)
    })
  }

  walk(folders)

  return options
}
