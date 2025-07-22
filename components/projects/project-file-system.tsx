"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FolderPlus } from "lucide-react";
import { FileItem } from "@/components/file-sys/file-item";
import { DropZone } from "@/components/file-sys/drop-zone";
import { FileViewer } from "@/components/file-sys/file-viewer";
import { BreadcrumbNav } from "@/components/file-sys/breadcrumb-nav";
import type { FileType } from "@/types/file-system";

interface ProjectFileSystemProps {
  projectId: string;
}

export function ProjectFileSystem({ projectId }: ProjectFileSystemProps) {
  const [items, setItems] = useState<FileType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPath, setCurrentPath] = useState<FileType[]>([]);

  // Load items when folder changes or projectId changes
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/contents?parentId=${currentFolderId}&projectId=${projectId}`
      );
      if (!response.ok) throw new Error("Failed to load items");
      const { items } = await response.json();
      setItems(items);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, projectId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newFolderName.trim(),
            parentId: currentFolderId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create folder");

      const { folder } = await response.json();
      setItems((prev) => [
        ...prev,
        { ...folder, type: "folder" as const },
      ]);
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("parentId", currentFolderId);

      const response = await fetch(
        `/api/projects/${projectId}/files`,
        { method: "POST", body: form }
      );

      if (!response.ok) throw new Error("Upload failed");

      // Clear the file input so the same file can be re-uploaded if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Re-fetch the current folder’s contents
      await loadItems();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleItemDoubleClick = (item: FileType) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      setCurrentPath(prev => [...prev, item]);
    } else {
      setSelectedFileId(item.id);
      setIsFileViewerOpen(true);
    }
  };

  const handleFileDrop = (files: FileList) => {
    Array.from(files).forEach(uploadFile);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
  };

  const handleNavigateBreadcrumb = useCallback((folderId: string) => {
    if (folderId === "root") {
      setCurrentFolderId("root");
      setCurrentPath([]);  // ✅ reset path
      return;
    }
  
    setCurrentPath(prev => {
      const idx = prev.findIndex(f => f.id === folderId);
      return idx !== -1 ? prev.slice(0, idx + 1) : prev;
    });
  
    setCurrentFolderId(folderId);
  }, []);

  const handleDelete = async (item: FileType) => {
    let url;
    if (item.type === "folder") {
      url = `/api/projects/${projectId}/folders/${item.id}`;
    } else {
      url = `/api/projects/${projectId}/files/${item.id}`;
    }

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }


  const selectedFile = selectedFileId
    ? items.find((item) => item.id === selectedFileId)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="p-4 border-b">
        <BreadcrumbNav
          path={currentPath}
          onNavigate={handleNavigateBreadcrumb}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 p-4 border-b">
        <Dialog
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
        >
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
                onChange={(e) =>
                  setNewFolderName(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && createFolder()
                }
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsCreateFolderOpen(false)
                  }
                >
                  Cancel
                </Button>
                <Button onClick={createFolder}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* File Grid */}
      <div className="flex-1 p-4">
        <DropZone
          onFileDrop={handleFileDrop}
          onItemDrop={() => {}}
          className="h-full rounded-lg border-2 border-dashed border-border"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FolderPlus className="h-16 w-16 mb-4" />
              <p className="text-lg font-medium">
                This folder is empty
              </p>
              <p className="text-sm">
                Drag and drop files here or create a new folder
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {items.map((item) => (
                <FileItem
                  key={item.id}
                  item={item}
                  onDoubleClick={() =>
                    handleItemDoubleClick(item)
                  }
                  onDelete={() => handleDelete(item)}
                  onDragStart={() => {}}
                  onView={
                    item.type === "file"
                      ? () => {
                          setSelectedFileId(item.id);
                          setIsFileViewerOpen(true);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </DropZone>
      </div>

      {/* File Viewer */}
      {isFileViewerOpen && selectedFile && (
        <FileViewer
          projectId={projectId}
          fileId={selectedFile.id}
          onClose={() => {
            setIsFileViewerOpen(false);
            setSelectedFileId(null);
          }}
          onDownload={(url) => {
            window.open(url, "_blank");
          }}
        />
      )}
    </div>
  );
}
