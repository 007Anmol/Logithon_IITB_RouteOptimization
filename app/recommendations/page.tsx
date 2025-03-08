"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Truck, Ship, Plane } from "lucide-react"

const routes = [
  { id: 1, mode: "Road", icon: Truck, duration: "2 days", cost: "$500" },
  { id: 2, mode: "Sea", icon: Ship, duration: "7 days", cost: "$300" },
  { id: 3, mode: "Air", icon: Plane, duration: "1 day", cost: "$1000" },
]

export default function Recommendations() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Link href="/">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipment Form
        </Button>
      </Link>
      <h1 className="text-3xl font-bold mb-8">Route Recommendations</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <route.icon className="mr-2 h-6 w-6" />
                  {route.mode} Transport
                </CardTitle>
                <CardDescription>Recommended Route #{route.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Estimated Duration: {route.duration}</p>
                <p>Estimated Cost: {route.cost}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Select This Route</Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

