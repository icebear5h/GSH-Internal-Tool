import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"


export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const broker = await prisma.broker.findUnique({
      where: { id: (await context.params).id },
      include: {
        brokerUpdates: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          // New: Include assigned user
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!broker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    return NextResponse.json(broker)
  } catch (error) {
    console.error(`Failed to fetch broker ${(await context.params).id}:`, error)
    return NextResponse.json({ error: "Failed to fetch broker" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()

    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: (await context.params).id },
    })

    if (!existingBroker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // Update the broker
    const broker = await prisma.broker.update({
      where: { id: (await context.params).id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        organization: body.organization || null,
        location: body.location || null,
        type: body.type || null,
        lastFollowUp: body.lastFollowUp ? new Date(body.lastFollowUp) : existingBroker.lastFollowUp,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : existingBroker.nextFollowUp,
        userId: body.userId || null, // New: Update assigned user
      },
    })

    return NextResponse.json(broker)
  } catch (error) {
    console.error(`Failed to update broker ${(await context.params).id}:`, error)
    return NextResponse.json({ error: "Failed to update broker" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: (await context.params).id },
    })

    if (!existingBroker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // Delete the broker (this will also cascade delete all updates)
    await prisma.broker.delete({
      where: { id: (await context.params).id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Failed to delete broker ${(await context.params).id}:`, error)
    return NextResponse.json({ error: "Failed to delete broker" }, { status: 500 })
  }
}
