import { useState, useRef, useEffect, useCallback } from "react"
import { ChatMessage } from "@/components/chat/chat-message"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ChatInput } from "@/components/chat/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle } from "lucide-react"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

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
  const [isGeneratingAIResponse, setIsGeneratingAIResponse] = useState(false) // New state for AI typing indicator
  const [isLoadingConversations, setIsLoadingConversations] = useState(true) // For sidebar conversations
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGeneratingAIResponse]) // Update dependency to new state

  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/projects/${projectId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        const sortedConversations = data.conversations
          .map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
          }))
          .sort((a: Conversation, b: Conversation) => b.updatedAt.getTime() - a.updatedAt.getTime()) // Sort by most recent

        setConversations(sortedConversations)

        // Select first conversation if available and no current one is selected
        if (!currentConversationId && sortedConversations.length > 0) {
          setCurrentConversationId(sortedConversations[0].id)
        } else if (currentConversationId && !sortedConversations.some((conv : Conversation) => conv.id === currentConversationId)) {
          // If current conversation was deleted, select the first one or null
          setCurrentConversationId(sortedConversations.length > 0 ? sortedConversations[0].id : null)
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [projectId, currentConversationId])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    } else {
      setMessages([])
    }
  }, [currentConversationId])

  const loadMessages = async (conversationId: string) => {
    try {
      // No AI typing indicator here, just loading messages
      const response = await fetch(`/api/projects/${projectId}/conversations/${conversationId}/messages`)
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

  const handleCreateConversation = async () => {
    try {
      setIsLoadingConversations(true) // Indicate creating new conversation
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
        setConversations((prev) =>
          [newConversation, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
        )
        setCurrentConversationId(newConversation.id)
        setMessages([])
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/projects/${projectId}/conversations/${conversationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from state
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        // If the deleted conversation was current, clear current and load first available
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null) // Will trigger useEffect to load first or clear messages
        }
        // Re-load conversations to ensure correct state and selection
        await loadConversations()
      } else {
        console.error("Failed to delete conversation")
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch(`/api/projects/${projectId}/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        setConversations((prev) =>
          prev
            .map((conv) => (conv.id === conversationId ? { ...conv, title: newTitle, updatedAt: new Date() } : conv))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
        )
      } else {
        console.error("Failed to rename conversation")
      }
    } catch (error) {
      console.error("Error renaming conversation:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    let conversationId = currentConversationId
    // Create a new conversation if none exists
    if (!conversationId) {
      try {
        setIsLoadingConversations(true) // Indicate creating new conversation
        const response = await fetch(`/api/projects/${projectId}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: messageText,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const newConversation = {
            ...data.conversation,
            createdAt: new Date(data.conversation.createdAt),
            updatedAt: new Date(data.conversation.updatedAt),
          }
          setConversations((prev) =>
            [newConversation, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
          )
          setCurrentConversationId(newConversation.id)
          conversationId = newConversation.id
        } else {
          setIsLoadingConversations(false)
          return
        }
      } catch (error) {
        console.error("Error creating conversation:", error)
        setIsLoadingConversations(false)
        return
      } finally {
        setIsLoadingConversations(false)
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
    setIsGeneratingAIResponse(true) // Set AI typing indicator to true
    console.log("DEBUG", { projectId, conversationId });

    try {
      const response = await fetch(`/api/projects/${projectId}/conversations/${conversationId}/messages`, {
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

        // Update the conversation's updatedAt timestamp in the sidebar
        setConversations((prev) =>
          prev
            .map((conv) => (conv.id === conversationId ? { ...conv, updatedAt: new Date() } : conv))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
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
      setIsGeneratingAIResponse(false) // Set AI typing indicator to false
    }
  }

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId)

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onCreateConversation={handleCreateConversation}
        isLoading={isLoadingConversations}
      />

      <div className="flex flex-col flex-1 h-full">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{currentConversation?.title || "Project Chat"}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {!currentConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project Chat</h3>
              <p className="text-gray-500 mb-4">Start a conversation about this project using the sidebar.</p>
            </div>
          ) : messages.length === 0 && !isGeneratingAIResponse ? ( // Use new state here
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
              {isGeneratingAIResponse && <TypingIndicator />} {/* Use new state here */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isGeneratingAIResponse || !currentConversationId} // Disable input while AI is typing
            placeholder="Ask about this project..."
          />
        </div>
      </div>
    </div>
  )
}
