import { prisma } from "@/lib/prisma"
import type { Document } from "@prisma/client"

export interface CreateFolderParams {
  name: string
  parentId?: string | null
  projectId?: string | null
}

export interface GetFolderContentsParams {
  parentId?: string | null
  projectId?: string | null
}

export class FolderService {
  static async createFolder({ name, parentId, projectId }: CreateFolderParams) {
    const realParentId = parentId === "root" ? null : parentId

    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        throw new Error("Project not found")
      }
    }

    // Validate parent folder belongs to same context
    if (realParentId) {
      const parentFolder = await prisma.folder.findUnique({ where: { id: realParentId } })
      if (!parentFolder) {
        throw new Error("Parent folder not found")
      }
      if (parentFolder.projectId !== (projectId || null)) {
        throw new Error("Parent folder does not belong to the specified project context")
      }
    }

    return await prisma.folder.create({
      data: {
        name,
        parentId: realParentId,
        projectId: projectId || null,
      },
    })
  }

  static async getFolderContents({ parentId, projectId }: GetFolderContentsParams) {
    const realParentId = parentId === "root" ? null : parentId

    // Get folders
    const folders = await prisma.folder.findMany({
      where: {
        parentId: realParentId,
        projectId: projectId || null,
      },
    })

    // Get documents
    let documents: Document[] = []
    if (realParentId) {
      documents = await prisma.document.findMany({
        where: { parentId: realParentId },
      })
    } else if (!projectId) {
      // Root level global documents only
      documents = await prisma.document.findMany({
        where: {
          parentId: null,
          folder: null,
        },
      })
    }

    const folderItems = folders.map((f) => ({
      id: f.id,
      name: f.name,
      type: "folder" as const,
      parentId: f.parentId,
      createdAt: f.createdAt,
      modifiedAt: f.modifiedAt,
    }))

    return [...folderItems, ...documents]
  }
}
