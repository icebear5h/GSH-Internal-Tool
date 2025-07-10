import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

    // Delete the conversation (messages will be deleted due to cascade)
    await prisma.conversation.delete({
      where: { id: conversationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; conversationId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, conversationId } = await params
    const { title } = await req.json()

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

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    })

    return NextResponse.json({ conversation: updatedConversation })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
