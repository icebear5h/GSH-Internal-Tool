"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useFileSystem } from "@/hooks/use-file-system"
import { FileItem } from "@/components/file-item"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { DropZone } from "@/components/drop-zone"
import type { DragItem } from "@/types/file-system"
import { ThemeToggle } from "@/components/theme-toggle"

export default function FileSystemPage() {
  const {
    currentFolderId,
    setCurrentFolderId,
    getCurrentFolderItems,
    getFolderPath,
    moveItem,
    createFolder,
    uploadFile,
    deleteItem,
  } = useFileSystem()

  const [newFolderName, setNewFolderName] = useState("")
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentItems = getCurrentFolderItems()
  const currentPath = getFolderPath(currentFolderId)

  const handleItemDoubleClick = (item: any) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id)
    }
  }

  const handleFileDrop = (files: FileList) => {
    Array.from(files).forEach((file) => {
      uploadFile(file, currentFolderId)
    })
  }

  const handleItemDrop = (draggedItem: DragItem) => {
    if (draggedItem.id !== currentFolderId) {
      moveItem(draggedItem.id, currentFolderId)
    }
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), currentFolderId)
      setNewFolderName("")
      setIsCreateFolderOpen(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        uploadFile(file, currentFolderId)
      })
    }
  }

  const handleDragStart = (item: DragItem) => {
    // Store the dragged item data
    setTimeout(() => {
      const dragEvent = new CustomEvent("dragstart")
      document.dispatchEvent(dragEvent)
    }, 0)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">File Manager</h1>
          <BreadcrumbNav path={currentPath} onNavigate={setCurrentFolderId} />
        </div>

        <div className="flex gap-2 mb-6">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>

          <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
        </div>

        <DropZone
          onFileDrop={handleFileDrop}
          onItemDrop={handleItemDrop}
          className="min-h-[400px] rounded-lg border-2 border-dashed border-border p-6"
        >
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FolderPlus className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm">Drag and drop files here or create a new folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {currentItems.map((item) => (
                <FileItem
                  key={item.id}
                  item={item}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onDelete={() => deleteItem(item.id)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          )}
        </DropZone>
      </div>
    </div>
  )
}
