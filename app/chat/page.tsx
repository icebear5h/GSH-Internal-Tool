"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@/components/chat/chat-message"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { Bot, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Load conversations on mount
  useEffect(() => {
    if (status === "authenticated") {
      loadConversations()
    }
  }, [status])

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
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        const sortedConversations = data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }))
        setConversations(sortedConversations)

        // If no current conversation and we have conversations, select the first one
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
      const response = await fetch("/api/conversations", {
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

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        const data = await response.json()
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  title: data.conversation.title,
                  updatedAt: new Date(data.conversation.updatedAt),
                }
              : conv,
          ),
        )
      }
    } catch (error) {
      console.error("Error renaming conversation:", error)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    let conversationId = currentConversationId

    // Create a new conversation if none exists
    if (!conversationId) {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: messageText.length > 30 ? messageText.substring(0, 30) + "..." : messageText }),
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

        // Update conversation in the list with new timestamp
        setConversations((prev) =>
          prev
            .map((conv) => (conv.id === conversationId ? { ...conv, updatedAt: new Date() } : conv))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        )
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

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

        if (currentConversationId === conversationId) {
          const remaining = conversations.filter((conv) => conv.id !== conversationId)
          setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null)
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access the chat.</p>
        </div>
      </div>
    )
  }

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex h-full">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 ease-in-out fixed lg:relative z-40 h-full`}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onCreateConversation={createNewConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentConversation ? currentConversation.title : "AI Assistant"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentConversation ? "Always here to help" : "Select or create a conversation"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {!currentConversationId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Welcome to AI Assistant</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Create a new conversation to get started</p>
                <Button onClick={createNewConversation}>Start New Chat</Button>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Start a conversation by typing a message below</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message.content}
                    isUser={message.role === "user"}
                    timestamp={message.createdAt}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto">
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} placeholder="Message AI Assistant..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
