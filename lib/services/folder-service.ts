import { prisma } from "@/lib/prisma"
import type { Document, Folder } from "@prisma/client"

export interface FileSystemItemBase {
  id: string
  name: string
  parentId: string | null
  createdAt: Date
  modifiedAt: Date
}

export type FileSystemItem =
  | FileSystemItemBase & { type: "folder"; projectId: string | null }
  | (FileSystemItemBase &
      Pick<Document, "storagePath" | "mimeType" | "size" | "projectId"> & {
        type: "file"
      })

export class FolderService {
  static async getFolderContents(
    parentId: string | null,
    projectId: string | null
  ): Promise<FileSystemItem[]> {
    const realParentId = parentId && parentId !== "root" ? parentId : null
    const realProjectId = projectId && projectId !== "root" ? projectId : null
    console.log("[API] parentId =", parentId, "realParentId =", realParentId);
    
    // 1) fetch sub-folders
    const folders = await prisma.folder.findMany({
      where: {
        parentId: realParentId,
        projectId: realProjectId,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        projectId: true,
        createdAt: true,
        modifiedAt: true,
      },
    })

    // 2) fetch documents
    const documents = await prisma.document.findMany({
      where: {
        parentId: realParentId,
        projectId: realProjectId,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        projectId: true,
        createdAt: true,
        modifiedAt: true,
        storagePath: true,
        mimeType: true,
        size: true,
      },
    })

    // 3) tag & merge
    const folderItems: FileSystemItem[] = folders.map((f) => ({
      ...f,
      type: "folder",
    }))

    const fileItems: FileSystemItem[] = documents.map((d) => ({
      ...d,
      type: "file",
    }))

    // 4) return folders first, then files
    return [...folderItems, ...fileItems]
  }
}
