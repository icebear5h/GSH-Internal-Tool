import type { Metadata } from "next"
import BrokerList from "@/components/brokers/broker-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs
import BrokerCalendarView from "@/components/brokers/broker-calendar-view" // Import Calendar View

export const metadata: Metadata = {
  title: "Broker Management",
  description: "Manage your real estate broker relationships",
}

export default async function BrokersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broker Management</h1>
          <p className="text-muted-foreground">Manage your broker relationships and track interactions</p>
        </div>
        <Link href="/brokers/new">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Broker
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list-view" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {" "}
          {/* Adjusted grid-cols */}
          <TabsTrigger value="list-view">All Brokers</TabsTrigger>
          <TabsTrigger value="next-followup">Next Follow-up</TabsTrigger>
          <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list-view" className="mt-6">
          <BrokerList />
        </TabsContent>
        <TabsContent value="next-followup" className="mt-6">
          {/* This will use the same BrokerList component but with a default sort */}
          <BrokerList sortBy="nextFollowUp" sortOrder="asc" />
        </TabsContent>
        <TabsContent value="calendar-view" className="mt-6">
          <BrokerCalendarView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
