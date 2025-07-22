import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Clock, Edit, MapPin, Phone, AtSign, User, Building } from "lucide-react" // Added User icon
import { format } from "date-fns"
import BrokerUpdateList from "@/components/brokers/broker-update-list"
import AddUpdateForm from "@/components/brokers/update-form"
import { BrokerUpdateType } from "@/types/file-system"


export default async function BrokerPage({ params }: { params: Promise<{ id: string }> }) {
  const broker = await fetch(`${process.env.INTERNAL_URL}/api/brokers/${(await params).id}`).then(res => res.json())

  if (!broker) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/brokers">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Brokers
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{broker.name}</h1>
        <Link href={`/brokers/${broker.id}/edit`}>
          <Button className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Broker
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Broker Details</h2>
            <div className="space-y-4">
              {broker.type && (
                <div className="flex items-center text-muted-foreground">
                  <span className="font-medium mr-2">Type:</span>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">{broker.type}</span>
                </div>
              )}

              {broker.email && (
                <div className="flex items-center text-muted-foreground">
                  <AtSign className="h-4 w-4 mr-2" />
                  <a href={`mailto:${broker.email}`} className="hover:underline">
                    {broker.email}
                  </a>
                </div>
              )}

              {broker.phone && (
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${broker.phone}`} className="hover:underline">
                    {broker.phone}
                  </a>
                </div>
              )}

              {broker.organization && (
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-2" />
                  <a href={`mailto:${broker.organization}`} className="hover:underline">
                    {broker.organization}
                  </a>
                </div>
              )}

              {broker.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{broker.location}</span>
                </div>
              )}

              {broker.user && ( // New: Display assigned user
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  <span>Assigned to: {broker.user.name || broker.user.email}</span>
                </div>
              )}

              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Last contacted: {format(new Date(broker.lastFollowUp), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Next follow-up: {format(new Date(broker.nextFollowUp), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Updates</h2>
            <div className="mt-4">
              <BrokerUpdateList updates={broker.brokerUpdates as BrokerUpdateType[]} />
            </div>
            <div className="mt-4">
              <AddUpdateForm brokerId={broker.id} />
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            <div className="text-muted-foreground">
              <p>
                <span className="font-medium">Updates:</span> {broker.brokerUpdates.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
