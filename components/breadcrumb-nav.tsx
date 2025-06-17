"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileItem } from "@/types/file-system"

interface BreadcrumbNavProps {
  path: FileItem[]
  onNavigate: (folderId: string) => void
}

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Button variant="ghost" size="sm" onClick={() => onNavigate("root")} className="h-8 px-2">
        <Home className="h-4 w-4" />
      </Button>
      {path.slice(1).map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          <Button variant="ghost" size="sm" onClick={() => onNavigate(folder.id)} className="h-8 px-2 font-medium">
            {folder.name}
          </Button>
        </div>
      ))}
    </nav>
  )
}
