"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, FolderPlus, Home, ChevronRight } from "lucide-react"
import { FileItem } from "@/components/file-sys/file-item"
import { DropZone } from "@/components/file-sys/drop-zone"
import { FileViewer } from "@/components/file-sys/file-viewer"
import type { FileType } from "@/types/file-system"

interface ProjectFileSystemProps {
  projectId: string
}

export function ProjectFileSystem({ projectId }: ProjectFileSystemProps) {
  const [items, setItems] = useState<FileType[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string>("root")
  const [loading, setLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load items when folder changes
  useEffect(() => {
    loadItems()
  }, [currentFolderId, projectId])

  const loadItems = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/folders?parentId=${currentFolderId}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      }
    } catch (error) {
      console.error("Error loading items:", error)
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setItems((prev) => [...prev, data.folder])
        setNewFolderName("")
        setIsCreateFolderOpen(false)
      }
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const uploadFile = async (file: File) => {
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("parentId", currentFolderId)

      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: form,
      })

      if (response.ok) {
        const data = await response.json()
        setItems((prev) => [...prev, data.document])
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  }

  const handleItemDoubleClick = (item: FileType) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id)
    } else {
      setSelectedFileId(item.id)
      setIsFileViewerOpen(true)
    }
  }

  const handleFileDrop = (files: FileList) => {
    Array.from(files).forEach((file) => {
      uploadFile(file)
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        uploadFile(file)
      })
    }
  }

  const selectedFile = selectedFileId ? items.find((item) => item.id === selectedFileId) : null

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="p-4 border-b">
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId("root")} className="h-8 px-2">
            <Home className="h-4 w-4" />
          </Button>
          {currentFolderId !== "root" && (
            <>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="font-medium">Current Folder</span>
            </>
          )}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 p-4 border-b">
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
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
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
      </div>

      {/* File Grid */}
      <div className="flex-1 p-4">
        <DropZone
          onFileDrop={handleFileDrop}
          onItemDrop={() => {}} // TODO: Implement drag and drop between folders
          className="h-full rounded-lg border-2 border-dashed border-border"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FolderPlus className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm">Drag and drop files here or create a new folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {items.map((item) => (
                <FileItem
                  key={item.id}
                  item={item}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onDelete={() => {}} // TODO: Implement delete
                  onDragStart={() => {}} // TODO: Implement drag start
                  onView={item.type === "file" ? () => setSelectedFileId(item.id) : undefined}
                />
              ))}
            </div>
          )}
        </DropZone>
      </div>

      {/* File Viewer */}
      {isFileViewerOpen && selectedFile && (
        <FileViewer
          fileId={selectedFile.id}
          fileUrl={selectedFile.storagePath || ""}
          onClose={() => {
            setIsFileViewerOpen(false)
            setSelectedFileId(null)
          }}
          onDownload={() => {
            if (!selectedFile) return
            // TODO: Implement download
          }}
        />
      )}
    </div>
  )
}
