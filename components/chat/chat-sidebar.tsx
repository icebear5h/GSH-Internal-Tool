"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, MessageCircle, Trash2, Edit2, MoreHorizontal, Calendar, Folder, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
  onCreateConversation: () => void
  isLoading: boolean
}

interface GroupedConversations {
  today: Conversation[]
  yesterday: Conversation[]
  thisWeek: Conversation[]
  thisMonth: Conversation[]
  older: Conversation[]
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onCreateConversation,
  isLoading,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter((conv) => conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredConversations(filtered)
    }
  }, [searchQuery, conversations])

  // Group conversations by time periods
  const groupConversations = (convs: Conversation[]): GroupedConversations => {
    const now = new Date()
    const groups: GroupedConversations = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    }

    convs.forEach((conv) => {
      const updatedAt = new Date(conv.updatedAt)

      if (isToday(updatedAt)) {
        groups.today.push(conv)
      } else if (isYesterday(updatedAt)) {
        groups.yesterday.push(conv)
      } else if (updatedAt > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groups.thisWeek.push(conv)
      } else if (updatedAt > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
        groups.thisMonth.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }

  const groupedConversations = groupConversations(filteredConversations)

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditingTitle(conversation.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const isEditing = editingId === conversation.id
    const [hasInitialFocus, setHasInitialFocus] = useState(false)

    // Focus input when editing starts, but only once
    useEffect(() => {
      if (isEditing && inputRef.current && !hasInitialFocus) {
        inputRef.current.focus()
        // Move cursor to end instead of selecting all
        const length = inputRef.current.value.length
        inputRef.current.setSelectionRange(length, length)
        setHasInitialFocus(true)
      } else if (!isEditing) {
        setHasInitialFocus(false)
      }
    }, [isEditing, hasInitialFocus])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit()
      } else if (e.key === "Escape") {
        handleCancelEdit()
      }
    }

    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          currentConversationId === conversation.id && "bg-gray-100 dark:bg-gray-800",
        )}
        onClick={() => !isEditing && onSelectConversation(conversation.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-6 text-sm font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveEdit()
                  }}
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCancelEdit()
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conversation.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
              </p>
            </>
          )}
        </div>

        {!isEditing && (isHovered || currentConversationId === conversation.id) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartEdit(conversation)
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conversation.id)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  const ConversationGroup = ({
    title,
    conversations,
    icon: Icon,
  }: {
    title: string
    conversations: Conversation[]
    icon: any
  }) => {
    if (conversations.length === 0) return null

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <Icon className="w-3 h-3" />
          {title}
        </div>
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button onClick={onCreateConversation} className="w-full justify-start gap-2 mb-3" disabled={isLoading}>
          <Plus className="w-4 h-4" />
          New chat
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chats found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat to get going</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <ConversationGroup title="Today" conversations={groupedConversations.today} icon={Calendar} />
              <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} icon={Calendar} />
              <ConversationGroup
                title="Previous 7 days"
                conversations={groupedConversations.thisWeek}
                icon={Calendar}
              />
              <ConversationGroup
                title="Previous 30 days"
                conversations={groupedConversations.thisMonth}
                icon={Folder}
              />
              <ConversationGroup title="Older" conversations={groupedConversations.older} icon={Folder} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  )
}
