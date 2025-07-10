import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        projectId,
        userId: session.user.id,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching project conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { title } = await req.json()

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "New Chat",
        userId: session.user.id,
        projectId,
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Error creating project conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
