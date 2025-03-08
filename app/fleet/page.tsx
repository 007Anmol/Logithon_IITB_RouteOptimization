"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const vehicles = [
  { id: "TRK001", type: "Truck", model: "Volvo FH", status: "Active", location: "New York" },
  { id: "VAN001", type: "Van", model: "Mercedes Sprinter", status: "In Maintenance", location: "Chicago" },
  { id: "CAR001", type: "Car", model: "Toyota Prius", status: "Active", location: "Los Angeles" },
  { id: "TRK002", type: "Truck", model: "Scania R450", status: "En Route", location: "Houston" },
  { id: "VAN002", type: "Van", model: "Ford Transit", status: "Active", location: "Miami" },
]

export default function Fleet() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">Fleet Management</h1>
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>Add Vehicle</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.id}</TableCell>
              <TableCell>{vehicle.type}</TableCell>
              <TableCell>{vehicle.model}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    vehicle.status === "Active"
                      ? "default"
                      : vehicle.status === "En Route"
                        ? "secondary"
                        : vehicle.status === "In Maintenance"
                          ? "outline"
                          : "destructive"
                  }
                >
                  {vehicle.status}
                </Badge>
              </TableCell>
              <TableCell>{vehicle.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  )
}

