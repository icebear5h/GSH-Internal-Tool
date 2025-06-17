import { File, Folder, ImageIcon, FileText, Music, Video, Archive } from "lucide-react"

interface FileIconProps {
  type: "file" | "folder"
  mimeType?: string
  className?: string
}

export function FileIcon({ type, mimeType, className = "h-6 w-6" }: FileIconProps) {
  if (type === "folder") {
    return <Folder className={className} />
  }

  if (!mimeType) {
    return <File className={className} />
  }

  if (mimeType.startsWith("image/")) {
    return <ImageIcon className={className} />
  }

  if (mimeType.startsWith("text/")) {
    return <FileText className={className} />
  }

  if (mimeType.startsWith("audio/")) {
    return <Music className={className} />
  }

  if (mimeType.startsWith("video/")) {
    return <Video className={className} />
  }

  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) {
    return <Archive className={className} />
  }

  return <File className={className} />
}
