import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import dotenv from "dotenv"
import crypto from "crypto"

dotenv.config()

const DEV_TOKEN  = "dev-token";   // must match your get_token_header
const USER_TOKEN = "user-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; conversationId: string }> },
) {
  const { projectId, conversationId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id:            conversationId,
        projectId,
        userId:        session.user.id,
      },
    })
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where:   { conversationId },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
    await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        role: "user",
        content,
      },
    })
    console.log('INTERNAL_API_URL is:', process.env.INTERNAL_API_URL);
    const res = await fetch(
      // add the ?token= query-param for verify_user
      
      `${process.env.INTERNAL_API_URL}/chat/message?token=${USER_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": DEV_TOKEN,        // header for get_token_header
        },
        body: JSON.stringify({
          // camelCase so it matches ChatRequest exactly
          conversationId: conversationId,
          projectId:      projectId,
          userMessage:    content,
        }),
      }
    )
    
    const payload = await res.json()

  if (!res.ok) {
    // log the raw payload for debugging
    console.error("FastAPI returned:", payload)
    // send an error response down to the client
    return NextResponse.json({ error: payload }, { status: res.status })
  }

  // on success, return the parsed body
  return NextResponse.json({ message: payload })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
