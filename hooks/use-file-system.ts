"use client"

import { useState, useCallback } from "react"
import type { FileItem } from "@/types/file-system"

export function useFileSystem() {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "root",
      name: "Root",
      type: "folder",
      parentId: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: "1",
      name: "Documents",
      type: "folder",
      parentId: "root",
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: "2",
      name: "Images",
      type: "folder",
      parentId: "root",
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: "3",
      name: "sample.txt",
      type: "file",
      size: 1024,
      parentId: "1",
      createdAt: new Date(),
      modifiedAt: new Date(),
      mimeType: "text/plain",
    },
    {
      id: "4",
      name: "photo.jpg",
      type: "file",
      size: 2048000,
      parentId: "2",
      createdAt: new Date(),
      modifiedAt: new Date(),
      mimeType: "image/jpeg",
    },
  ])

  const [currentFolderId, setCurrentFolderId] = useState<string>("root")

  const getCurrentFolderItems = useCallback(() => {
    return files.filter((file) => file.parentId === currentFolderId)
  }, [files, currentFolderId])

  const getFolderPath = useCallback(
    (folderId: string): FileItem[] => {
      const path: FileItem[] = []
      let currentId = folderId

      while (currentId) {
        const folder = files.find((f) => f.id === currentId)
        if (folder) {
          path.unshift(folder)
          currentId = folder.parentId || ""
        } else {
          break
        }
      }

      return path
    },
    [files],
  )

  const moveItem = useCallback((itemId: string, newParentId: string) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === itemId ? { ...file, parentId: newParentId, modifiedAt: new Date() } : file)),
    )
  }, [])

  const createFolder = useCallback((name: string, parentId: string) => {
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: "folder",
      parentId,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }
    setFiles((prev) => [...prev, newFolder])
  }, [])

  const uploadFile = useCallback((file: File, parentId: string) => {
    const newFile: FileItem = {
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: "file",
      size: file.size,
      parentId,
      createdAt: new Date(),
      modifiedAt: new Date(),
      mimeType: file.type,
    }
    setFiles((prev) => [...prev, newFile])
  }, [])

  const deleteItem = useCallback(
    (itemId: string) => {
      const deleteRecursive = (id: string) => {
        const children = files.filter((f) => f.parentId === id)
        children.forEach((child) => deleteRecursive(child.id))
        setFiles((prev) => prev.filter((f) => f.id !== id))
      }
      deleteRecursive(itemId)
    },
    [files],
  )

  return {
    files,
    currentFolderId,
    setCurrentFolderId,
    getCurrentFolderItems,
    getFolderPath,
    moveItem,
    createFolder,
    uploadFile,
    deleteItem,
  }
}
