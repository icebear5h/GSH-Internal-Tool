"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { BrokerType } from "@/types/file-system"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, LayoutGrid, List } from "lucide-react" // Added LayoutGrid and List icons
import BrokerCard from "./broker-card"
import BrokerListItem from "./broker-list-item" // New: Import BrokerListItem
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs components

interface BrokerListProps {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function BrokerList({ sortBy = 'name', sortOrder = 'asc' }: BrokerListProps) {
  const [brokers, setBrokers] = useState<BrokerType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortByState, setSortBy] = useState(sortBy) // New: Sort by state
  const [sortOrderState, setSortOrder] = useState(sortOrder) // New: Sort order state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [brokerToDelete, setBrokerToDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"card" | "list">("card") // New: View mode state
  const router = useRouter()
  const { toast } = useToast()

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery)     params.append("query", searchQuery);
      if (typeFilter!=="all") params.append("type", typeFilter);
      params.append("sortBy", sortByState);
      params.append("sortOrder", sortOrderState);
  
      const res = await fetch(`/api/brokers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch brokers");
  
      const payload = await res.json();
      // if your API returns an array: data = [{…},…]
      // if it returns { brokers: […], meta: {…} } then adjust below
      const list = Array.isArray(payload)
        ? payload
        : payload.brokers || [];
  
      setBrokers(list);
  
      // for debugging, you can also:
      console.log("fetched brokers:", list);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load brokers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, sortByState, sortOrderState, toast]);

  useEffect(() => {
    fetchBrokers()
  }, [fetchBrokers])

  const handleDelete = async (brokerId: string) => {
    setBrokerToDelete(brokerId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!brokerToDelete) return

    try {
      const res = await fetch(`/api/brokers/${brokerToDelete}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete broker")

      toast({
        title: "Success",
        description: "Broker deleted successfully",
      })

      // Remove the deleted broker from the list
      setBrokers(brokers.filter((broker) => broker.id !== brokerToDelete))
    } catch (error) {
      console.error("Error deleting broker:", error)
      toast({
        title: "Error",
        description: "Failed to delete broker. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setBrokerToDelete(null)
    }
  }

  const viewBroker = (id: string) => {
    router.push(`/brokers/${id}`)
  }

  const editBroker = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    router.push(`/brokers/${id}/edit`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search brokers..." value={searchQuery} onChange={handleSearchChange} className="pl-10" />
        </div>
        <div className="w-full md:w-64">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-64">
          <Select
            value={sortByState}
            onValueChange={(value) => {
              setSortBy(value)
              // Default sort order for nextFollowUp is ascending (recent to future)
              if (value === "nextFollowUp") {
                setSortOrder("asc")
              } else {
                setSortOrder("desc")
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastFollowUp">Last Contact</SelectItem>
              <SelectItem value="nextFollowUp">Next Contact</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-32 flex justify-end">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "card" | "list")}>
            <TabsList>
              <TabsTrigger value="card" className="p-2">
                <LayoutGrid className="h-5 w-5" />
                <span className="sr-only">Card View</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="p-2">
                <List className="h-5 w-5" />
                <span className="sr-only">List View</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "card" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brokers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No brokers found</p>
          <Button onClick={() => router.push("/brokers/new")}>Add a Broker</Button>
        </div>
      ) : (
        <>
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brokers.map((broker) => (
                <BrokerCard
                  key={broker.id}
                  broker={broker}
                  onClick={() => viewBroker(broker.id)}
                  onEdit={(e) => editBroker(e, broker.id)}
                  onDelete={(e) => {
                    e.stopPropagation()
                    handleDelete(broker.id)
                  }}
                />
              ))}
            </div>
          )}
          {viewMode === "list" && (
            <div className="border rounded-lg divide-y">
              {brokers.map((broker) => (
                <BrokerListItem
                  key={broker.id}
                  broker={broker}
                  onClick={() => viewBroker(broker.id)}
                  onEdit={(e) => editBroker(e, broker.id)}
                  onDelete={(e) => {
                    e.stopPropagation()
                    handleDelete(broker.id)
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the broker and all associated updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
