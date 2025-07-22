import type React from "react"
import type { BrokerType, BrokerUpdateType } from "@/types/file-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MapPin, Phone, AtSign, Clock, User, Building } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface BrokerListItemProps {
  broker: BrokerType & { brokerUpdates: BrokerUpdateType[] }
  onClick?: () => void
  onEdit?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
}

export default function BrokerListItem({
  broker,
  onClick,
  onEdit,
  onDelete,
}: BrokerListItemProps) {
  const nextFollowUpDate = new Date(broker.nextFollowUp);
  const latestUpdate = broker.brokerUpdates?.[0];

  return (
    <div
      className="flex flex-col p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* ─── Top row: details + actions ───────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        {/* Details grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 items-center">
          {/* Name */}
          <div className="font-semibold text-lg truncate">{broker.name}</div>

          {/* Email / Phone */}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {broker.email && (
              <div className="flex items-center gap-1">
                <AtSign className="h-3.5 w-3.5" />
                <span className="truncate">{broker.email}</span>
              </div>
            )}
            {broker.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{broker.phone}</span>
              </div>
            )}
          </div>

          {/* Location / User */}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {broker.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{broker.location}</span>
              </div>
            )}
            {broker.user && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">
                  Assigned to: {broker.user.name || broker.user.email}
                </span>
              </div>
            )}
          </div>

          {/* Type / Org / Next */}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {broker.type && (
              <Badge variant="outline" className="w-fit">
                {broker.type}
              </Badge>
            )}
            {broker.organization && (
              <div className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                <span className="truncate">{broker.organization}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span title={format(nextFollowUpDate, "PPpp")}>
                Next: {formatDistanceToNow(nextFollowUpDate, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Edit / Delete buttons */}
        <div className="flex gap-1 ml-4">
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

      {/* ─── Bottom row: Latest update ───────────────────────────────────────────── */}
      {latestUpdate && (
        <p className="mt-4 text-base italic text-muted-foreground truncate">
          <span className="font-medium">Latest update:</span> {latestUpdate.content}
        </p>
      )}
    </div>
  );
}

