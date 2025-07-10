import type { FileType } from "@/types/file-system"

/**
 * Generates the full path for a given folder ID, including "Home" (root).
 * @param folderId The ID of the current folder.
 * @param allItems An array of all available files and folders to construct the path.
 * @returns An array of FileType objects representing the path from root to the current folder.
 */
export function getFolderPath(folderId: string, allItems: FileType[]): FileType[] {
  const path: FileType[] = []

  // Always start with a Home/root node
  path.push({
    id: "root",
    name: "Home",
    type: "folder",
    parentId: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
  })

  // Then walk up from folderId, unless it's "root"
  if (folderId !== "root") {
    let currentId: string | null = folderId
    const tempPath: FileType[] = [] // Build path in reverse

    while (currentId && currentId !== "root") {
      const node = allItems.find((f) => f.id === currentId)
      if (!node) break // Stop if we don't have this folder cached
      tempPath.push(node) // Append it
      currentId = node.parentId // Go up one level
    }
    path.push(...tempPath.reverse()) // Add reversed path to main path
  }

  return path
}
