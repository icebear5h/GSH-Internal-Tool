import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = req.nextUrl.searchParams.get("projectId")

    const whereClause: any = { userId: session.user.id }
    if (projectId) {
      whereClause.projectId = projectId
    } else {
      whereClause.projectId = null // Only global conversations
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, projectId } = await req.json()

    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "New Chat",
        userId: session.user.id,
        projectId: projectId || null,
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
