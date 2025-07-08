import { useState, useEffect, useCallback } from "react"
import type { FileType } from "@/types/file-system"

export function useFileSystem() {
  const [items, setItems] = useState<FileType[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string>("root")
  const [loading, setLoading] = useState(false)

  // 1. fetch whenever currentFolderId changes
  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      try {
        const response = await fetch(`/api/contents?parentId=${currentFolderId}`);
        const { items } = await response.json();
        setItems(items);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [currentFolderId]);

  // 2. create a folder
  const createFolder = useCallback(async (name: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      const { folder } = await response.json();
      setItems(f => [...f, folder]);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  }, [currentFolderId]);

  // 3. upload a file
  const uploadFile = useCallback(async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("parentId", currentFolderId);
      const response = await fetch("/api/files", {
        method: "POST",
        body: form,
      });
      const { document } = await response.json();
      setItems(f => [...f, document]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [currentFolderId]);

  // 4. move (or rename) an item
  const moveItem = useCallback(async (id: string, newParentId: string) => {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });
      const { file: updated } = await response.json();
      setItems(f => f.map(x => (x.id === id ? updated : x)));
    } catch (error) {
      console.error('Error moving item:', error);
    }
  }, []);

  // 5. delete an item
  const deleteItem = useCallback(async (id: string) => {
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      setItems(f => f.filter(x => x.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, []);

  // 6. utility
  const getFileById = useCallback(
    (id: string) => items.find((f) => f.id === id),
    [items]
  )

  const getFolderPath = useCallback(
    (folderId: string): FileType[] => {
      const path: FileType[] = []

      // always start with a Home/root node
      path.push({
        id:        "root",
        name:      "Home",
        type:      "folder",
        parentId:  null,
        createdAt: new Date(),
        modifiedAt:new Date(),
      })

      // then walk up from folderId, unless it's "root"
      if (folderId !== "root") {
        let currentId: string | null = folderId
        while (currentId && currentId !== "root") {
          const node = items.find((f) => f.id === currentId)
          if (!node) break          // stop if we don't have this folder cached
          path.push(node)           // append it
          currentId = node.parentId // go up one level
        }
      }

      return path
    },
    [items]
  )

  return {
    items,
    loading,
    currentFolderId,
    setCurrentFolderId,
    createFolder,
    getFolderPath,
    uploadFile,
    moveItem,
    deleteItem,
    getFileById,
  }
}
