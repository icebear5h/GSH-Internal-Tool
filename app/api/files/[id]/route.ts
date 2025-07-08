import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .storage.from("documents").createSignedUrl(doc.storagePath, 300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ downloadUrl: data.signedUrl })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { name, parentId } = await req.json()
  const { id } = await params
  const file = await prisma.document.update({
    where: { id },
    data: { name, parentId },
  })
  return NextResponse.json({ file })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await prisma.document.findUnique({ where: { id } })
  if (doc) {
    await supabaseAdmin.storage.from("documents").remove([doc.storagePath])
    await prisma.document.delete({ where: { id } })
  }
  return new NextResponse(null, { status: 204 });
}
