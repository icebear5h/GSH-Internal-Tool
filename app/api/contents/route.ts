import { type NextRequest, NextResponse } from "next/server"
import { FolderService } from "@/lib/services/folder-service"

export async function GET(req: NextRequest) {
  try {
    const parentId = req.nextUrl.searchParams.get("parentId")
    const projectId = req.nextUrl.searchParams.get("projectId")

    const items = await FolderService.getFolderContents(parentId, projectId)

    return NextResponse.json({ items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
