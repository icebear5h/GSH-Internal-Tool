import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File
    let parentId = (form.get("parentId") as string) || null
    const projectId = (form.get("projectId") as string) || null

    if (parentId === "root") parentId = null

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      // Validate parent folder belongs to project
      if (parentId) {
        const parentFolder = await prisma.folder.findFirst({
          where: { id: parentId, projectId },
        })
        if (!parentFolder) {
          return NextResponse.json({ error: "Parent folder not found in project" }, { status: 400 })
        }
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const id = crypto.randomUUID()

    // Dynamic storage path based on context
    const storagePath = projectId ? `projects/${projectId}/${id}` : `documents/${id}`

    const { error: uploadError } = await supabaseAdmin.storage.from("documents").upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

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
