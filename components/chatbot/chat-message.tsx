import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp: Date
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 border",
        )}
      >
        <p className="text-sm">{message}</p>
        <p className={cn("text-xs mt-1 opacity-70", isUser ? "text-blue-100" : "text-gray-500")}>
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
