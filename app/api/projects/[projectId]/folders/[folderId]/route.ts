import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> },
) {
  try {
    const { projectId, folderId } = await params
    const { name, parentId } = await req.json()

    // Verify folder belongs to project
    const existingFolder = await prisma.folder.findFirst({
      where: { id: folderId, projectId },
    })

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // If changing parent, verify new parent belongs to same project
    if (parentId && parentId !== "root") {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, projectId },
      })
      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found in project" }, { status: 400 })
      }
    }

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name,
        parentId: parentId === "root" ? null : parentId,
      },
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error("Error updating folder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> },
) {
  try {
    const { projectId, folderId } = await params

    // Verify folder belongs to project
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, projectId },
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    // Delete folder (this will cascade to children and documents)
    await prisma.folder.delete({ where: { id: folderId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
