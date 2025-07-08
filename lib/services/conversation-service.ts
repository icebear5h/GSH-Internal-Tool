import { prisma } from "@/lib/prisma"

export interface CreateConversationParams {
  title: string
  userId: string
  projectId?: string | null
}

export interface GetConversationsParams {
  userId: string
  projectId?: string | null
}

export class ConversationService {
  static async createConversation({ title, userId, projectId }: CreateConversationParams) {
    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        throw new Error("Project not found")
      }
    }

    return await prisma.conversation.create({
      data: {
        title: title || "New Chat",
        userId,
        projectId: projectId || null,
      },
    })
  }

  static async getConversations({ userId, projectId }: GetConversationsParams) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        projectId: projectId || null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}
