import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
  params: {
    id: string
  }
}

export async function GET(req: NextRequest, { params }: {params: {id: string}}) {
  try {
    const broker = await prisma.broker.findUnique({
      where: { id: (await params).id },
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
    console.error(`Failed to fetch broker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch broker" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()

    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: (await params).id },
    })

    if (!existingBroker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // Update the broker
    const broker = await prisma.broker.update({
      where: { id: (await params).id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
        type: body.type || null,
        lastFollowUp: body.lastFollowUp ? new Date(body.lastFollowUp) : existingBroker.lastFollowUp,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : existingBroker.nextFollowUp,
        userId: body.userId || null, // New: Update assigned user
      },
    })

    return NextResponse.json(broker)
  } catch (error) {
    console.error(`Failed to update broker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update broker" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: {params: {id: string}}) {
  try {
    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: (await params).id },
    })

    if (!existingBroker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    // Delete the broker (this will also cascade delete all updates)
    await prisma.broker.delete({
      where: { id: (await params).id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Failed to delete broker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete broker" }, { status: 500 })
  }
}
