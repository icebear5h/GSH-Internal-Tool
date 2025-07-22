"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message:   string
  isUser:    boolean
  timestamp: Date
}

export function ChatMessage({
  message,
  isUser,
  timestamp,
}: ChatMessageProps) {
  const visible = message.replace(/<think>[\s\S]*?<\/think>/g, "").trim()

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 border"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // map paragraph tags to your existing text-sm class
            p: ({ children }) => (
              <p className="text-sm leading-relaxed">{children}</p>
            ),
            // you can customize other elements (h1,h2,ul,li,code...) here too
          }}
        >
          {visible}
        </ReactMarkdown>

        {/* timestamp stays the same */}
        <p
          className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-blue-100" : "text-gray-500"
          )}
        >
          {timestamp.toLocaleTimeString([], {
            hour:   "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}
