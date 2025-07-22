import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import type { DragItem } from "@/types/file-system"

interface DropZoneProps {
  onFileDrop: (files: FileList) => void
  onItemDrop: (item: DragItem) => void
  children: React.ReactNode
  className?: string
}

export function DropZone({ onFileDrop, onItemDrop, children, className = "" }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // Check if it's a file drop from outside
    if (e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files)
      return
    }

    // Check if it's an internal item drop
    const dragData = e.dataTransfer.getData("application/json")
    if (dragData) {
      try {
        const item: DragItem = JSON.parse(dragData)
        onItemDrop(item)
      } catch (error) {
        console.error("Failed to parse drag data:", error)
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${className}`}
    >
      {children}

      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-medium text-primary">Drop files here</p>
          </div>
        </div>
      )}
    </div>
  )
}
