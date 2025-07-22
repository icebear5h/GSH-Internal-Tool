"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, isSameDay } from "date-fns"
import type { BrokerType } from "@/types/file-system"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Clock, User } from "lucide-react"

export default function BrokerCalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [brokersForSelectedDate, setBrokersForSelectedDate] = useState<BrokerType[]>([])
  const [allBrokers, setAllBrokers] = useState<BrokerType[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 1) Fetch brokers as before
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/brokers?sortBy=nextFollowUp&sortOrder=asc")
        if (!res.ok) throw new Error()
        setAllBrokers(await res.json())
      } catch {
        toast({ title: "Error", description: "Failed to load brokers.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [toast])

  useEffect(() => {
    if (allBrokers.length) {
      setBrokersForSelectedDate(allBrokers.filter((b) => isSameDay(new Date(b.nextFollowUp), selectedDate)))
    } else {
      setBrokersForSelectedDate([])
    }
  }, [selectedDate, allBrokers])

  const countsByDate = React.useMemo(() => {
    return allBrokers.reduce<Record<string, number>>((map, b) => {
      const key = format(new Date(b.nextFollowUp), "yyyy-MM-dd")
      map[key] = (map[key] ?? 0) + 1
      return map
    }, {})
  }, [allBrokers])

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const viewBroker = (id: string) => router.push(`/brokers/${id}`)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Next Follow‑up Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            required={false}
            className="w-full"
            classNames={{
              months: "w-full border border-gray-200",
              weekdays: "grid grid-cols-7 text-sm text-gray-500 border-b border-gray-200",
              week: "grid grid-cols-7 divide-x divide-gray-200 border-t border-gray-200",
                day: "flex-1 aspect-square flex flex-col items-center justify-center p-1",
              day_today: "ring-2 ring-blue-500",
              day_selected: "bg-black text-white ring-0",
              day_outside: "text-gray-300",
            }}
            components={{
              DayButton: ({ day, modifiers, children, ...props }) => {
                const key = format(day.date, "yyyy-MM-dd")
                const count = countsByDate[key] ?? 0
                return (
                  <CalendarDayButton
                    day={day}
                    modifiers={modifiers}
                    {...props}
                    className="flex flex-col items-center justify-center p-1"
                  >
                    <span className="relative -top-1 font-medium">{children}</span>
                    {!modifiers.outside && count > 0 && (
                      <span className="mt-auto text-xs font-semibold text-blue-600 text-center">
                        {count} appt{count > 1 ? "s" : ""}
                      </span>
                    )}
                  </CalendarDayButton>
                )
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Sidebar List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Brokers for {format(selectedDate, "PPP")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground">Loading brokers…</div>
          ) : brokersForSelectedDate.length === 0 ? (
            <div className="text-center text-muted-foreground">No follow‑ups scheduled.</div>
          ) : (
            <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
              <div className="space-y-4">
                {brokersForSelectedDate.map((broker) => (
                  <div key={broker.id} className="border rounded-md p-3 flex flex-col gap-2">
                    <h3 className="font-semibold text-base">{broker.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Follow‑up: {format(new Date(broker.nextFollowUp), "p")}</span>
                    </div>
                    {broker.user && (
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <User className="h-3.5 w-3.5" />
                        <span>Assigned to: {broker.user.name || broker.user.email}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent"
                      onClick={() => viewBroker(broker.id)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
