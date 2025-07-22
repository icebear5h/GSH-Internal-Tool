import type { Metadata } from "next"
import BrokerForm from "@/components/brokers/broker-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Add New Broker",
  description: "Add a new broker to your network",
}

export default function NewBrokerPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Add New Broker</h1>
      </div>

      <div className="max-w-2xl">
        <BrokerForm />
      </div>
    </div>
  )
}
