import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // await params before using them
  const { id } = await context.params

  const session = await auth()
  const userId = session?.user?.id

  // Add this check to ensure a user is authenticated
  if (!userId) {
    return NextResponse.json({ error: "Authentication required to add updates." }, { status: 401 })
  }

  try {
    const body = await req.json()

    // check broker exists
    const broker = await prisma.broker.findUnique({
      where: { id },
    })
    if (!broker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // validate content
    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // create the update, connecting both relations
    const update = await prisma.brokerUpdate.create({
      data: {
        content: body.content.trim(),
        user: { connect: { id: userId } },
        broker: { connect: { id } },
      },
    })

    // bump the broker’s lastFollowUp timestamp
    await prisma.broker.update({
      where: { id },
      data: { lastFollowUp: new Date() },
    })

    return NextResponse.json(update, { status: 201 })
  } catch (error) {
    console.error(`Failed to create update for broker ${id}:`, error)
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // await params once
  const { id } = await context.params

  try {
    // check broker exists
    const broker = await prisma.broker.findUnique({
      where: { id },
    })
    if (!broker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // fetch updates
    const updates = await prisma.brokerUpdate.findMany({
      where: { brokerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true }, // <-- grab the name
        },
      },
    })

    return NextResponse.json(updates)
  } catch (error) {
    console.error(`Failed to fetch updates for broker ${id}:`, error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}
