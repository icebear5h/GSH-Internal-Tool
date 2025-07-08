"use client"

import type React from "react"

import { useSession, } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import { Upload, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useFileSystem } from "@/hooks/use-file-system"
import { FileItem } from "@/components/file-sys/file-item"
import { BreadcrumbNav } from "@/components/file-sys/breadcrumb-nav"
import { DropZone } from "@/components/file-sys/drop-zone"
import { FileViewer } from "@/components/file-sys/file-viewer"
import type { DragItem } from "@/types/file-system"
import { signOut } from "next-auth/react"
import { FileType } from "@/types/file-system"

export default function FileSystemPage() {
  const {
    items,
    currentFolderId,
    setCurrentFolderId,
    moveItem,
    createFolder,
    getFolderPath,
    uploadFile,
    deleteItem,
    getFileById,
  } = useFileSystem()

  // mirror hook’s items into local state
  useEffect(() => {
    console.log(items)
  }, [items])

  
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false)
  const [contextFolderId, setContextFolderId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session, status } = useSession()
  const selectedFile = selectedFileId ? getFileById(selectedFileId) : null
  

  const handleItemDoubleClick = (item: any) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id)
    } else {
      setSelectedFileId(item.id)
      setIsFileViewerOpen(true)
    }
  }

  const handleViewFile = (fileId: string) => {
    setSelectedFileId(fileId)
    setIsFileViewerOpen(true)
  }

  const handleCreateFolderInContext = (parentId: string) => {
    setContextFolderId(parentId)
    setIsCreateFolderOpen(true)
  }

  const handleFileDrop = (files: FileList) => {
    Array.from(files).forEach((file) => {
      uploadFile(file)
    })
  }

  const handleItemDrop = (draggedItem: DragItem) => {
    if (draggedItem.id !== currentFolderId) {
      moveItem(draggedItem.id, currentFolderId)
    }
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)
      setContextFolderId(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        uploadFile(file)
      })
    }
  }

  const handleDragStart = (item: DragItem) => {
    setTimeout(() => {
      const dragEvent = new CustomEvent("dragstart")
      document.dispatchEvent(dragEvent)
    }, 0)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access the file system.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">


      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">File System</h1>
          <p className="text-muted-foreground mb-4">Welcome, {session?.user?.name || session?.user?.email}</p>
          <BreadcrumbNav
            path={getFolderPath(currentFolderId)}
            onNavigate={setCurrentFolderId}
          />
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
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FolderPlus className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm">Drag and drop files here or create a new folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {items.map((item) => (
                <FileItem
                  key={item.id}
                  item={item}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  onDelete={() => deleteItem(item.id)}
                  onDragStart={handleDragStart}
                  onView={item.type === "file" ? () => handleViewFile(item.id) : undefined}
                  onCreateFolder={item.type === "folder" ? () => handleCreateFolderInContext(item.id) : undefined}
                />
              ))}
            </div>
          )}
        </DropZone>
      </div>
      {isFileViewerOpen && selectedFile && (
        <FileViewer
          fileId={selectedFile?.id || ""}
          fileUrl={selectedFile?.storagePath || ""}
          onClose={() => {
            setIsFileViewerOpen(false)
            setSelectedFileId(null)
          }}
          onDownload={() => {
            if (!selectedFile) return;
          
            fetch(`/api/files?storageUrl=${selectedFile.storagePath}`)
              .then(res => res.json())
              .then(async ({ downloadUrl }) => {
                // 1. Fetch the actual file
                const fileRes = await fetch(downloadUrl);
                if (!fileRes.ok) throw new Error("Failed to fetch file");
          
                // 2. Read it as a blob
                const blob = await fileRes.blob();
          
                // 3. Create an object URL for the blob
                const url = URL.createObjectURL(blob);
          
                // 4. Create a temporary <a> and click it
                const a = document.createElement("a");
                a.href = url;
                a.download = selectedFile.name; // file name
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
          
                // 5. Release the object URL
                URL.revokeObjectURL(url);
              })
              .catch(err => {
                console.error("Download failed:", err);
                // you may want to surface an error toast here
              });
          }}
        />
      )}
    </div>
  )
}
