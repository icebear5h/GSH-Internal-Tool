import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const type = searchParams.get("type") || undefined
    const sortBy = searchParams.get("sortBy") || "lastFollowUp" // New: Default sort
    const sortOrder = searchParams.get("sortOrder") || "desc" // New: Default sort order

    const orderBy: Record<string, "asc" | "desc"> = {}
    if (sortBy === "nextFollowUp") {
      orderBy.nextFollowUp = sortOrder as "asc" | "desc"
    } else {
      orderBy.lastFollowUp = sortOrder as "asc" | "desc"
    }

    const brokers = await prisma.broker.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
            ],
          },
          type && type !== "all" ? { type } : {}, // Updated condition for "all"
        ],
      },
      orderBy: orderBy, // Use dynamic orderBy
      include: {
        _count: {
          select: { brokerUpdates: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        brokerUpdates: {
          // Include latest update for list view
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true, content: true, createdAt: true },
        },
      },
    })

    return NextResponse.json(brokers)
  } catch (error) {
    console.error("Failed to fetch brokers:", error)
    return NextResponse.json({ error: "Failed to fetch brokers" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Calculate nextFollowUp if not provided, e.g., 1 month from lastFollowUp or now
    const lastFollowUpDate = body.lastFollowUp ? new Date(body.lastFollowUp) : new Date()
    const nextFollowUpDate = body.nextFollowUp
      ? new Date(body.nextFollowUp)
      : new Date(lastFollowUpDate.setMonth(lastFollowUpDate.getMonth() + 1))

    // Create the broker
    const broker = await prisma.broker.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
        type: body.type || null,
        lastFollowUp: lastFollowUpDate,
        nextFollowUp: nextFollowUpDate,
        userId: body.userId || null, // New: Assign user
      },
    })

    return NextResponse.json(broker, { status: 201 })
  } catch (error) {
    console.error("Failed to create broker:", error)
    return NextResponse.json({ error: "Failed to create broker" }, { status: 500 })
  }
}
