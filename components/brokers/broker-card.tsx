import type React from "react"
import type { BrokerType } from "@/types/file-system"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MapPin, Phone, AtSign, Clock, User } from "lucide-react" // Added User icon
import { format, formatDistanceToNow } from "date-fns"

interface BrokerCardProps {
  broker: BrokerType & { _count?: { updates: number } }
  onClick?: () => void
  onEdit?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
}

export default function BrokerCard({ broker, onClick, onEdit, onDelete }: BrokerCardProps) {
  const lastContactedDate = new Date(broker.lastFollowUp)
  const nextFollowUpDate = new Date(broker.nextFollowUp)

  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg truncate">{broker.name}</h3>
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>

        {broker.type && (
          <Badge variant="outline" className="mb-4">
            {broker.type}
          </Badge>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          {broker.email && (
            <div className="flex items-center gap-2">
              <AtSign className="h-3.5 w-3.5" />
              <span className="truncate">{broker.email}</span>
            </div>
          )}
          {broker.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              <span>{broker.phone}</span>
            </div>
          )}
          {broker.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{broker.location}</span>
            </div>
          )}
          {broker.user && ( // New: Display assigned user
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">Assigned to: {broker.user.name || broker.user.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span title={format(lastContactedDate, "PPpp")}>
              Last contact: {formatDistanceToNow(lastContactedDate, { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span title={format(nextFollowUpDate, "PPpp")}>
              Next follow-up: {formatDistanceToNow(nextFollowUpDate, { addSuffix: true })}
            </span>
          </div>
        </div>

        {broker._count && (
          <div className="mt-4 text-sm text-muted-foreground">
            {broker._count.updates} update{broker._count.updates !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
