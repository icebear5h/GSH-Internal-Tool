"use client"

import type React from "react"

import { useState } from "react"
import { MoreHorizontal, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileIcon } from "./file-icon"
import type { FileItem as FileItemType, DragItem } from "@/types/file-system"
import { formatBytes } from "@/lib/utils"

interface FileItemProps {
  item: FileItemType
  onDoubleClick: () => void
  onDelete: () => void
  onDragStart: (item: DragItem) => void
}

export function FileItem({ item, onDoubleClick, onDelete, onDragStart }: FileItemProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart({
      id: item.id,
      type: item.type,
      name: item.name,
    })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={onDoubleClick}
      className={`group relative p-4 rounded-lg border-2 border-dashed border-transparent hover:border-border hover:bg-accent/50 cursor-pointer transition-all ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-col items-center space-y-2">
        <FileIcon
          type={item.type}
          mimeType={item.mimeType}
          className="h-12 w-12 text-muted-foreground group-hover:text-foreground"
        />
        <div className="text-center">
          <p className="text-sm font-medium truncate max-w-[120px]" title={item.name}>
            {item.name}
          </p>
          {item.type === "file" && item.size && (
            <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
