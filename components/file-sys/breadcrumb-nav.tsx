"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FileType } from "@/types/file-system"

interface BreadcrumbNavProps {
  /** Only folders should be in here */
  path: FileType[]
  onNavigate: (folderId: string) => void
}

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  // Only folders
  const folders = path.filter((node) => node.type === "folder");

  // If the first folder is root, skip it — we’ll always show our own Home.
  const rest = folders[0]?.id === "root" ? folders.slice(1) : folders;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate("root")}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
      </Button>

      {rest.map((folder) => (
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
  );
}
