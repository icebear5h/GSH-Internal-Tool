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

export interface UserType {
  id: string
  name: string | null
  email: string | null
}

export interface BrokerType {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  organization?: string | null
  location?: string | null
  type?: string | null
  brokerUpdates: BrokerUpdateType[]
  lastFollowUp: Date
  nextFollowUp: Date
  userId?: string | null // New field for user assignment
  user?: UserType | null // New relation to User
}

export interface BrokerUpdateType {
  id: string
  content: string
  createdAt: Date
  brokerId: string
  broker: BrokerType
  userId: string
  user: UserType
}
