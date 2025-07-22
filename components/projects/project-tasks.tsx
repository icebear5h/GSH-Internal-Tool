import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  Flag,
} from "lucide-react"
import { formatDistanceToNow, format, isAfter } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: Date | null
  priority: "low" | "medium" | "high"
  createdAt: Date
  updatedAt: Date
}

interface ProjectTasksProps {
  projectId: string
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        const formattedTasks = data.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
        }))
        setTasks(formattedTasks)
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          dueDate: newTask.dueDate || null,
          priority: newTask.priority,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const formattedTask = {
          ...data.task,
          createdAt: new Date(data.task.createdAt),
          updatedAt: new Date(data.task.updatedAt),
          dueDate: data.task.dueDate ? new Date(data.task.dueDate) : null,
        }
        setTasks((prev) => [formattedTask, ...prev])
        setNewTask({ title: "", description: "", dueDate: "", priority: "medium" })
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const data = await response.json()
        const formattedTask = {
          ...data.task,
          createdAt: new Date(data.task.createdAt),
          updatedAt: new Date(data.task.updatedAt),
          dueDate: data.task.dueDate ? new Date(data.task.dueDate) : null,
        }
        setTasks((prev) => prev.map((task) => (task.id === taskId ? formattedTask : task)))
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const toggleTaskCompletion = (task: Task) => {
    updateTask(task.id, { completed: !task.completed })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-3 h-3" />
      case "medium":
        return <Flag className="w-3 h-3" />
      case "low":
        return <Circle className="w-3 h-3" />
      default:
        return null
    }
  }

  const isOverdue = (dueDate: Date | null) => {
    return dueDate && isAfter(new Date(), dueDate)
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const pendingTasks = tasks.filter((task) => !task.completed)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Project Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {pendingTasks.length} pending, {completedTasks.length} completed
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border rounded-md"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTask} disabled={!newTask.title.trim()}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Create your first task to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Tasks</h3>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                <div className="flex items-center gap-1">
                                  {getPriorityIcon(task.priority)}
                                  <span className="capitalize">{task.priority}</span>
                                </div>
                              </Badge>
                            </div>
                            {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.dueDate && (
                                <div
                                  className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? "text-red-600" : ""}`}
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Due {format(task.dueDate, "MMM d, yyyy 'at' h:mm a")}
                                    {isOverdue(task.dueDate) && " (Overdue)"}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Completed Tasks</h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <Card key={task.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-600 line-through truncate">{task.title}</h4>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 mb-2 line-through">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Completed {formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteTask(task.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
