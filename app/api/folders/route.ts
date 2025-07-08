import { type NextRequest, NextResponse } from "next/server"
import { FolderService } from "@/lib/services/folder-service"

export async function POST(req: NextRequest) {
  try {
    const { name, parentId, projectId } = await req.json()

    const folder = await FolderService.createFolder({
      name,
      parentId,
      projectId,
    })

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
