"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectFileSystem } from "@/components/projects/project-file-system"
import { ProjectChat } from "@/components/projects/project-chat"
import { ProjectTasks } from "@/components/projects/project-tasks"
import { ArrowLeft, FolderOpen, MessageCircle, CheckSquare } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    folders: number
    conversations: number
    tasks: number
  }
}

export default function ProjectPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      loadProject()
    }
  }, [status, projectId])

  const loadProject = async () => {
    try {
      setIsLoading(true)
      console.log("Loading project with ID:", projectId)
      const response = await fetch(`/api/projects/${projectId}`)
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      setDebugInfo({
        status: response.status,
        ok: response.ok,
        data: data,
      })

      if (response.ok && data.project) {
        setProject({
          ...data.project,
          createdAt: data.project.createdAt ? new Date(data.project.createdAt) : new Date(),
          updatedAt: data.project.updatedAt ? new Date(data.project.updatedAt) : new Date(),
        })
      } else {
        setProject(null)
      }
    } catch (error) {
      console.error("Error loading project:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setDebugInfo({ error: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access projects.</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <p className="text-sm text-gray-500 mb-4">Project ID: {projectId}</p>

          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          <Button asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && <p className="text-muted-foreground">{project.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                <span>{project._count.folders} folders</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4" />
                <span>{project._count.tasks} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{project._count.conversations} conversations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs defaultValue="files" className="h-[calc(100vh-200px)]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Project Files
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <ProjectFileSystem projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="h-full mt-4">
            <Card className="h-full">
              <CardContent className="h-full p-0">
                <ProjectTasks projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Project Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <ProjectChat projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
