import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  const update = await prisma.folder.update({
    where: { id: params.id },
    data: {
      name:     data.name,
      parentId: data.parentId,
    },
  })
  return NextResponse.json({ folder: update })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.folder.delete({ where: { id: params.id } })
  return NextResponse.json(null, { status: 204 })
}