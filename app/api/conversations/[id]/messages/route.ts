import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content, role } = await req.json()

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: id,
        role: "user",
        content,
      },
    })

    // Generate AI response (simple simulation for now)
    const aiResponse = await generateAIResponse(content)

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId: id,
        role: "assistant",
        content: aiResponse,
      },
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Simple AI response simulation - replace with actual AI integration later
async function generateAIResponse(userMessage: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Simple response logic for demo
  const responses = [
    "That's an interesting question! Let me think about that for a moment.",
    "I understand what you're asking. Here's what I think...",
    "Great point! I'd be happy to help you with that.",
    "Thanks for sharing that with me. Here's my perspective...",
    "I see what you mean. Let me provide some insights on that topic.",
    "That's a thoughtful question. Based on what you've mentioned...",
    "I appreciate you bringing this up. Here's how I would approach it...",
  ]

  const baseResponse = responses[Math.floor(Math.random() * responses.length)]

  // Add some context based on the user message
  if (userMessage.toLowerCase().includes("file") || userMessage.toLowerCase().includes("document")) {
    return `${baseResponse} I can help you with file-related questions. You can upload documents to the file system and I can assist you in understanding their contents.`
  }

  if (userMessage.toLowerCase().includes("help")) {
    return "I'm here to help! I can assist you with questions about your files, provide summaries of documents, help you find information, and have general conversations. What would you like to know?"
  }

  return `${baseResponse} You mentioned: "${userMessage}". How else can I assist you today?`
}
