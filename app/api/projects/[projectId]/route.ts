import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    console.log("API: Starting project fetch")

    const session = await auth()
    console.log("API: Session check:", !!session?.user?.id)

    if (!session?.user?.id) {
      console.log("API: Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    console.log("API: Project ID from params:", projectId)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            folders: true,
            conversations: true,
            tasks: true,
          },
        },
      },
    })

    console.log("API: Project found:", !!project)
    console.log("API: Project data:", project ? { id: project.id, name: project.name } : null)

    if (!project) {
      console.log("API: Project not found in database")
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("API: Returning project successfully")
    return NextResponse.json({ project })
  } catch (error) {
    console.error("API: Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
