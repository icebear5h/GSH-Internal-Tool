import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$connect()
    const count = await prisma.user.count()
    return NextResponse.json(
      { message: `✅ Connected—found ${count} users` },
      { status: 200 }
    )
  } catch (error: unknown) {
    return NextResponse.json(
      {
        message: "❌ Connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
