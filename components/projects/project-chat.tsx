"use client"

import { useState, useRef, useEffect } from "react"
import { ChatMessage } from "@/components/chat/chat-message"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ChatInput } from "@/components/chat/chat-input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageCircle } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface ProjectChatProps {
  projectId: string
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [projectId])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    } else {
      setMessages([])
    }
  }, [currentConversationId])

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/projects/${projectId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        const sortedConversations = data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }))
        setConversations(sortedConversations)

        // Select first conversation if available
        if (!currentConversationId && sortedConversations.length > 0) {
          setCurrentConversationId(sortedConversations[0].id)
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          })),
        )
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })

      if (response.ok) {
        const data = await response.json()
        const newConversation = {
          ...data.conversation,
          createdAt: new Date(data.conversation.createdAt),
          updatedAt: new Date(data.conversation.updatedAt),
        }
        setConversations((prev) => [newConversation, ...prev])
        setCurrentConversationId(newConversation.id)
        setMessages([])
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    let conversationId = currentConversationId

    // Create a new conversation if none exists
    if (!conversationId) {
      try {
        const response = await fetch(`/api/projects/${projectId}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: messageText.length > 30 ? messageText.substring(0, 30) + "..." : messageText,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const newConversation = {
            ...data.conversation,
            createdAt: new Date(data.conversation.createdAt),
            updatedAt: new Date(data.conversation.updatedAt),
          }
          setConversations((prev) => [newConversation, ...prev])
          setCurrentConversationId(newConversation.id)
          conversationId = newConversation.id
        } else {
          return
        }
      } catch (error) {
        console.error("Error creating conversation:", error)
        return
      }
    }

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText, role: "user" }),
      })

      if (response.ok) {
        const data = await response.json()

        // Add AI response
        const aiMessage: Message = {
          id: data.message.id,
          role: "assistant",
          content: data.message.content,
          createdAt: new Date(data.message.createdAt),
        }

        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{currentConversation?.title || "Project Chat"}</span>
          </div>
          <Button size="sm" onClick={createNewConversation}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {!currentConversationId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Chat</h3>
            <p className="text-gray-500 mb-4">Start a conversation about this project</p>
            <Button onClick={createNewConversation}>Start New Chat</Button>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-8 h-8 text-gray-400 mb-4" />
            <p className="text-gray-500">Start a conversation by typing a message below</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.content}
                isUser={message.role === "user"}
                timestamp={message.createdAt}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} placeholder="Ask about this project..." />
      </div>
    </div>
  )
}
