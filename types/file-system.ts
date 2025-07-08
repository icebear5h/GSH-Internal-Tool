export interface FileType {
  id: string
  name: string
  type: "file" | "folder"
  size?: number
  parentId: string | null
  createdAt: Date
  modifiedAt: Date
  mimeType?: string
  storagePath?: string
  fileData?: ArrayBuffer | string
}

export interface DragItem {
  id: string
  type: "file" | "folder"
  name: string
}
