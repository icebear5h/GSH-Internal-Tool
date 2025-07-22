import type { BrokerUpdateType } from "@/types/file-system"
import { format } from "date-fns"

interface BrokerUpdateListProps {
  updates: BrokerUpdateType[]
}

export default function BrokerUpdateList({ updates }: BrokerUpdateListProps) {
  if (updates.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">No updates yet. Add the first update above.</div>
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <div key={update.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
            <span>{format(new Date(update.createdAt), "MMM d, yyyy • h:mm a")}</span>
            <span className="font-medium text-primary">{update.user?.name || "Unknown User"}</span>
          </div>
          <div className="whitespace-pre-wrap">{update.content}</div>
        </div>
      ))}
    </div>
  )
}
