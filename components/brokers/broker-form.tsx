"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { BrokerType, UserType } from "@/types/file-system" // Import UserType
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { format, addMonths } from "date-fns" // Import addMonths

interface BrokerFormProps {
  broker?: BrokerType
}

export default function BrokerForm({ broker }: BrokerFormProps) {
  const isEditing = !!broker
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserType[]>([]) // State for users
  const [formData, setFormData] = useState({
    name: broker?.name || "",
    email: broker?.email || "",
    phone: broker?.phone || "",
    organization: broker?.organization || "",
    location: broker?.location || "",
    type: broker?.type || "None",
    lastFollowUp: broker?.lastFollowUp
      ? format(new Date(broker.lastFollowUp), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    nextFollowUp: broker?.nextFollowUp // New: nextFollowUp field
      ? format(new Date(broker.nextFollowUp), "yyyy-MM-dd")
      : format(addMonths(new Date(), 1), "yyyy-MM-dd"), // Default to 1 month from now
    userId: broker?.userId || "", // New: userId field
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error("Failed to fetch users")
        const data = await res.json()
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users for assignment.",
          variant: "destructive",
        })
      }
    }
    fetchUsers()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "None" ? "" : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/brokers/${broker.id}` : "/api/brokers"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save broker")
      }

      const savedBroker = await res.json()

      toast({
        title: "Success",
        description: isEditing ? "Broker updated successfully" : "New broker created successfully",
      })

      // Redirect
      router.push(isEditing ? `/brokers/${broker.id}` : `/brokers/${savedBroker.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error saving broker:", error)
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update broker. Please try again."
          : "Failed to create broker. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Broker name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            name="organization"
            placeholder="Organization name"
            value={formData.organization}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="City, State"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Broker Type</Label>
          <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select broker type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="userId">Assigned User</Label>
          <Select value={formData.userId} onValueChange={(value) => handleSelectChange("userId", value)}>
            <SelectTrigger id="userId">
              <SelectValue placeholder="Assign a user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lastFollowUp">Last Follow-up</Label>
          <Input
            id="lastFollowUp"
            name="lastFollowUp"
            type="date"
            value={formData.lastFollowUp}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nextFollowUp">Next Follow-up</Label>
          <Input
            id="nextFollowUp"
            name="nextFollowUp"
            type="date"
            value={formData.nextFollowUp}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Broker" : "Create Broker"}
        </Button>
      </div>
    </form>
  )
}
