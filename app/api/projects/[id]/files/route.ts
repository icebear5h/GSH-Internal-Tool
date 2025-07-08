import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse the multipart form
    const form = await req.formData()
    const file = form.get("file") as File
    let parentId = (form.get("parentId") as string) || null
    if (parentId === "root") parentId = null

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Turn it into a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Choose an ID + storagePath
    const id = crypto.randomUUID()
    const storagePath = `projects/${projectId}/${id}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage.from("documents").upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // If parentId is provided, verify it belongs to this project
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          projectId,
        },
      })

      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found in this project" }, { status: 400 })
      }
    }

    // Record metadata in Postgres
    const document = await prisma.document.create({
      data: {
        id,
        name: file.name,
        mimeType: file.type,
        size: buffer.byteLength,
        storagePath,
        parentId,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
