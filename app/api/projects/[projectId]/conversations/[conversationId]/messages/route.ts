import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; conversationId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, conversationId } = await params

    // Verify the conversation belongs to the user and project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; conversationId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, conversationId } = await params
    const { content } = await req.json()
    const role = "user"
    // Verify the conversation belongs to the user and project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
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
        conversationId,
        role: "user",
        content,
      },
    })

    const fastapiResponse = await fetch("http://localhost:8000/chat", {
      // Replace with your actual FastAPI URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Potentially add an Authorization header if your FastAPI requires it
        // "Authorization": `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        conversationId: conversationId, // Pass conversation ID for FastAPI to link messages
        userId: session.user.id, // Pass user ID for FastAPI to verify/link
        userMessage: content,
      }),
    })


    return NextResponse.json({ message: fastapiResponse })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
