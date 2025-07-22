import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MessageCircle, Trash2, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  isLoading: boolean
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading,
}: ConversationListProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    onDeleteConversation(conversationId)
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2" />
        Loading...
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between bg-transparent">
          <div className="flex items-center gap-2 truncate">
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{currentConversation ? currentConversation.title : "Select Chat"}</span>
          </div>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <DropdownMenuLabel>Recent Conversations</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400">Create your first chat to get started</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <DropdownMenuItem
              key={conversation.id}
              className="flex items-start justify-between p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => {
                onSelectConversation(conversation.id)
                setIsOpen(false)
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span
                    className={`text-sm font-medium truncate ${
                      conversation.id === currentConversationId ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {conversation.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => handleDelete(e, conversation.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
