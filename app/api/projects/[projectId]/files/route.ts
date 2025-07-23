import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import dotenv from "dotenv"
dotenv.config()

const DEV_TOKEN  = "dev-token";   // must match your get_token_header
const USER_TOKEN = "user-token";

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const form = await req.formData()
    const file = form.get("file") as File
    
    const parentIdRaw = form.get("parentId");
    console.log("📥 Server got parentId:", parentIdRaw);
    let parentId = (parentIdRaw as string) || null;
    if (parentId === "root") parentId = null;

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate project
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Validate parent folder belongs to project (if parentId is not null)
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, projectId },
      })
      if (!parentFolder) {
        return NextResponse.json({ error: "Parent folder not found in project" }, { status: 400 })
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const id = crypto.randomUUID()

    const storagePath = `projects/${projectId}/${id}`

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
        parentId, // This is the parent folder ID (can be null for project root)
        projectId, // NEW: Link document directly to the project
      },
    })
    await fetch(`${process.env.INTERNAL_API_URL}/embedding/embed-file?token=${USER_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": DEV_TOKEN,        // header for get_token_header
      },
      body: JSON.stringify({ 
        project_id: projectId, 
        document_id: document.id,
        bucket: "documents", 
        key: storagePath, 
        fileType: file.type 
      }),
    });

    return NextResponse.json({ document }, { status: 201 })
  } catch (err: unknown) {
    console.error("Upload error:", err)
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
