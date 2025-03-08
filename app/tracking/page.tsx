"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, MapPin, Truck } from "lucide-react"

const shipmentStatus = [
  { id: 1, status: "Order Received", date: "2023-05-01", icon: Package },
  { id: 2, status: "In Transit", date: "2023-05-03", icon: Truck },
  { id: 3, status: "Out for Delivery", date: "2023-05-05", icon: Truck },
  { id: 4, status: "Delivered", date: "2023-05-06", icon: MapPin },
]

export default function Tracking() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Link href="/">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </Link>
      <h1 className="text-3xl font-bold mb-8">Shipment Tracking</h1>
      <Card>
        <CardHeader>
          <CardTitle>Shipment #12345</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {shipmentStatus.map((status, index) => (
              <motion.div
                key={status.id}
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <status.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="ml-4 flex-grow">
                  <h3 className="text-lg font-semibold">{status.status}</h3>
                  <p className="text-sm text-muted-foreground">{status.date}</p>
                </div>
                {index < shipmentStatus.length - 1 && (
                  <motion.div
                    className="absolute left-4 mt-4 w-0.5 bg-muted-foreground"
                    initial={{ height: 0 }}
                    animate={{ height: 64 }}
                    transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

