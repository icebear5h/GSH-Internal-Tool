export interface FileItem {
  id: string
  name: string
  type: "file" | "folder"
  size?: number
  parentId: string | null
  createdAt: Date
  modifiedAt: Date
  mimeType?: string
}

export interface DragItem {
  id: string
  type: "file" | "folder"
  name: string
}
