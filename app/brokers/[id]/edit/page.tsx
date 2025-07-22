import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import BrokerForm from "@/components/brokers/broker-form"
import { BrokerType } from "@/types/file-system"

interface EditBrokerPageProps {
  params: Promise<{ id: string }>
}

interface BrokerFormProps {
  broker?: BrokerType
}

export async function generateMetadata({ params }: EditBrokerPageProps): Promise<Metadata> {
  const broker = await prisma.broker.findUnique({
    where: { id: (await params).id },
    include: {
      brokerUpdates: true,
    },
  })

  if (!broker) {
    return {
      title: "Broker Not Found",
      description: "The requested broker could not be found",
    }
  }

  return {
    title: `Edit Broker: ${broker.name}`,
    description: `Edit details for broker ${broker.name}`,
  }
}

export default async function EditBrokerPage({ params }: EditBrokerPageProps) {
  const broker = await prisma.broker.findUnique({
    where: { id: (await params).id },
  })

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
