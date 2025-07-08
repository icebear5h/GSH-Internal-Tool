"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileType } from "@/types/file-system"

interface BreadcrumbNavProps {
  /** only folder entries, but we’ll guard just in case */
  path: FileType[]
  onNavigate: (folderId: string) => void
}

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  // drop any non-folder entries
  const folders = path.filter((node) => node.type === "folder")

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {/* Home always goes to root */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate("root")}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
      </Button>

      {folders.slice(1).map((folder) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className="h-8 px-2 font-medium"
          >
            {folder.name}
          </Button>
        </div>
      ))}
    </nav>
  )
}
