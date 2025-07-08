import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const parentId = req.nextUrl.searchParams.get("parentId")

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const realParentId = !parentId || parentId === "root" ? null : parentId

    const folders = await prisma.folder.findMany({
      where: {
        projectId,
        parentId: realParentId,
      },
    })

    const documents = await prisma.document.findMany({
      where: {
        folder: {
          projectId,
          parentId: realParentId,
        },
      },
    })

    const folderItems = folders.map((f) => ({
      id: f.id,
      name: f.name,
      type: "folder" as const,
      parentId: f.parentId,
      createdAt: f.createdAt,
      modifiedAt: f.modifiedAt,
    }))

    return NextResponse.json({ items: [...folderItems, ...documents] })
  } catch (error) {
    console.error("Error fetching project folders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { name, parentId } = await req.json()

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const realParentId = parentId === "root" ? null : parentId

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: realParentId,
        projectId,
      },
    })

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error("Error creating project folder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
