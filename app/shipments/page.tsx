"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const shipments = [
  {
    id: "SH001",
    customer: "Acme Corp",
    origin: "New York",
    destination: "Los Angeles",
    status: "In Transit",
    eta: "2023-06-15",
  },
  {
    id: "SH002",
    customer: "Globex",
    origin: "Chicago",
    destination: "Houston",
    status: "Delivered",
    eta: "2023-06-12",
  },
  {
    id: "SH003",
    customer: "Initech",
    origin: "Miami",
    destination: "Seattle",
    status: "Processing",
    eta: "2023-06-18",
  },
  {
    id: "SH004",
    customer: "Umbrella Corp",
    origin: "Boston",
    destination: "San Francisco",
    status: "In Transit",
    eta: "2023-06-16",
  },
  { id: "SH005", customer: "Hooli", origin: "Austin", destination: "Denver", status: "Delayed", eta: "2023-06-17" },
]

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredShipments = shipments.filter(
    (shipment) =>
      shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">Shipments</h1>
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search shipments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>New Shipment</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ETA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredShipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">{shipment.id}</TableCell>
              <TableCell>{shipment.customer}</TableCell>
              <TableCell>{shipment.origin}</TableCell>
              <TableCell>{shipment.destination}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    shipment.status === "Delivered"
                      ? "outline"
                      : shipment.status === "In Transit"
                        ? "default"
                        : shipment.status === "Processing"
                          ? "secondary"
                          : "destructive"
                  }
                >
                  {shipment.status}
                </Badge>
              </TableCell>
              <TableCell>{shipment.eta}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  )
}

