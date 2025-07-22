import { File, Folder, ImageIcon, FileText, Music, Video, Archive, Sheet } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileIconProps {
  type: "file" | "folder"
  mimeType?: string
  className?: string
  showBackground?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

const backgroundSizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
}

export function FileIcon({ type, mimeType, className, showBackground = false, size = "md" }: FileIconProps) {
  const iconSize = className || sizeClasses[size]

  if (type === "folder") {
    const folderIcon = <Folder className={cn(iconSize, "text-blue-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-blue-100", backgroundSizeClasses[size])}>
          {folderIcon}
        </div>
      )
    }
    return folderIcon
  }

  if (!mimeType) {
    const defaultIcon = <File className={cn(iconSize, "text-gray-500")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-gray-100", backgroundSizeClasses[size])}>
          {defaultIcon}
        </div>
      )
    }
    return defaultIcon
  }

  // Image files
  if (mimeType.startsWith("image/")) {
    const imageIcon = <ImageIcon className={cn(iconSize, "text-blue-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-blue-100", backgroundSizeClasses[size])}>
          {imageIcon}
        </div>
      )
    }
    return imageIcon
  }

  // PDF files
  if (mimeType === "application/pdf") {
    const pdfIcon = <FileText className={cn(iconSize, "text-red-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-red-100", backgroundSizeClasses[size])}>
          {pdfIcon}
        </div>
      )
    }
    return pdfIcon
  }

  // Excel/Spreadsheet files
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const excelIcon = <Sheet className={cn(iconSize, "text-green-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-green-100", backgroundSizeClasses[size])}>
          {excelIcon}
        </div>
      )
    }
    return excelIcon
  }

  // Text files
  if (mimeType.startsWith("text/")) {
    const textIcon = <FileText className={cn(iconSize, "text-gray-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-gray-100", backgroundSizeClasses[size])}>
          {textIcon}
        </div>
      )
    }
    return textIcon
  }

  // Audio files
  if (mimeType.startsWith("audio/")) {
    const audioIcon = <Music className={cn(iconSize, "text-purple-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-purple-100", backgroundSizeClasses[size])}>
          {audioIcon}
        </div>
      )
    }
    return audioIcon
  }

  // Video files
  if (mimeType.startsWith("video/")) {
    const videoIcon = <Video className={cn(iconSize, "text-indigo-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-indigo-100", backgroundSizeClasses[size])}>
          {videoIcon}
        </div>
      )
    }
    return videoIcon
  }

  // Word files
  if (mimeType.includes("msword")) {
    const wordIcon = <DocIcon className={cn(iconSize, "text-blue-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-blue-100", backgroundSizeClasses[size])}>
          {wordIcon}
        </div>
      )
    }
    return wordIcon
  }

  // Archive files
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) {
    const archiveIcon = <Archive className={cn(iconSize, "text-orange-600")} />

    if (showBackground) {
      return (
        <div className={cn("flex items-center justify-center rounded-lg bg-orange-100", backgroundSizeClasses[size])}>
          {archiveIcon}
        </div>
      )
    }
    return archiveIcon

  }

  // Default fallback
  const defaultIcon = <File className={cn(iconSize, "text-gray-500")} />

  if (showBackground) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-gray-100", backgroundSizeClasses[size])}>
        {defaultIcon}
      </div>
    )
  }
  return defaultIcon
}

// Legacy components for backward compatibility
export function PdfIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return <FileIcon type="file" mimeType="application/pdf" className={className} showBackground size={size} />
}

export function ExcelIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <FileIcon
      type="file"
      mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      className={className}
      showBackground
      size={size}
    />
  )
}

export function DocIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <FileIcon
      type="file"
      mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      className={className}
      showBackground
      size={size}
    />
  )
}

// Utility function for easy usage
export function getFileIcon(
  fileName: string,
  mimeType?: string,
  showBackground = false,
  size: "sm" | "md" | "lg" = "md",
) {
  const isFolder = !fileName.includes(".")

  if (isFolder) {
    return <FileIcon type="folder" showBackground={showBackground} size={size} />
  }

  // Try to determine MIME type from file extension if not provided
  let detectedMimeType = mimeType

  if (!detectedMimeType) {
    const extension = fileName.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        detectedMimeType = "application/pdf"
        break
      case "xlsx":
      case "xls":
        detectedMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        break
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        detectedMimeType = "image/jpeg"
        break
      case "mp3":
      case "wav":
      case "flac":
        detectedMimeType = "audio/mpeg"
        break
      case "mp4":
      case "avi":
      case "mov":
        detectedMimeType = "video/mp4"
        break
      case "zip":
      case "rar":
      case "7z":
        detectedMimeType = "application/zip"
        break
      case "txt":
      case "md":
        detectedMimeType = "text/plain"
        break
      case "doc":
      case "docx":
        detectedMimeType = "application/msword"
        break
    }
  }

  return <FileIcon type="file" mimeType={detectedMimeType} showBackground={showBackground} size={size} />
}
