import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Add this simple test to see if the file is being read
console.log("🚀 Projects route file loaded!")

export async function GET() {
  try {
    console.log("API: GET /api/projects - Starting")

    const session = await auth()
    console.log("API: Session check:", !!session?.user?.id)

    if (!session?.user?.id) {
      console.log("API: Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
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

    console.log("API: Found projects:", projects.length)
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("API: Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 API: POST /api/projects - Starting")

    const session = await auth()
    console.log("API: Session check:", !!session?.user?.id)

    if (!session?.user?.id) {
      console.log("API: Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("API: Request body:", body)

    const { name, description } = body

    if (!name?.trim()) {
      console.log("API: Missing project name")
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    console.log("API: Created project:", { id: project.id, name: project.name })
    return NextResponse.json({ project })
  } catch (error) {
    console.error("API: Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
