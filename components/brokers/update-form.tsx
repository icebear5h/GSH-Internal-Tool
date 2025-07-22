"use client"
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/auth"

interface AddUpdateFormProps {
  brokerId: string
}

export default function AddUpdateForm({ brokerId }: AddUpdateFormProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Update content cannot be empty",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/brokers/${brokerId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content,
         }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add update")
      }

      toast({
        title: "Success",
        description: "Update added successfully",
      })

      // Clear the input
      setContent("")

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error adding update:", error)
      toast({
        title: "Error",
        description: "Failed to add update. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Add a new update or note about this broker..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
        disabled={loading}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "Adding..." : "Add Update"}
        </Button>
      </div>
    </form>
  )
}
