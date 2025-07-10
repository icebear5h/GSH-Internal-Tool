import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
  try {
    const { projectId, fileId } = await params

    // Verify file belongs to project using the new projectId field
    const doc = await prisma.document.findFirst({
      where: {
        id: fileId,
        projectId: projectId, // Use the new projectId field for direct filtering
      },
    })

    if (!doc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin.storage.from("documents").createSignedUrl(doc.storagePath, 300)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return metadata along with the signed URL
    return NextResponse.json({
      downloadUrl: data.signedUrl,
      metadata: {
        id: doc.id,
        name: doc.name,
        size: doc.size,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
        modifiedAt: doc.modifiedAt,
      },
    })
  } catch (error) {
    console.error("Error getting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
  try {
    const { projectId, fileId } = await params
    const { name, parentId } = await req.json()

    // Verify file belongs to project using the new projectId field
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: fileId,
        projectId: projectId, // Use the new projectId field for direct filtering
      },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
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

    const file = await prisma.document.update({
      where: { id: fileId },
      data: {
        name,
        parentId: parentId === "root" ? null : parentId,
      },
    })

    return NextResponse.json({ file })
  } catch (error) {
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> },
) {
  try {
    const { projectId, fileId } = await params

    // Verify file belongs to project using the new projectId field
    const doc = await prisma.document.findFirst({
      where: {
        id: fileId,
        projectId: projectId, // Use the new projectId field for direct filtering
      },
    })

    if (!doc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete from storage
    await supabaseAdmin.storage.from("documents").remove([doc.storagePath])

    // Delete from database
    await prisma.document.delete({ where: { id: fileId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
