import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import BrokerForm from "@/components/brokers/broker-form"
import { BrokerType } from "@/types/file-system"


export default async function EditBrokerPage({ params }: { params: Promise<{ id: string }> }) {
  const broker = await fetch(`/api/brokers/${(await params).id}`).then(res => res.json()) 

  if (!broker) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/brokers/${(await params).id}`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Broker
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit {broker.name}</h1>
      </div>

      <div className="max-w-2xl">
        <BrokerForm broker={broker as BrokerType} />
      </div>
    </div>
  )
}
