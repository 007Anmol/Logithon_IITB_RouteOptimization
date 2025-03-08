"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Package, ArrowRight } from "lucide-react"

const formFields = [
  { id: "senderName", label: "Sender Name", type: "text" },
  { id: "category", label: "Shipment Category", type: "select" },
  { id: "weight", label: "Weight (kg)", type: "number" },
  { id: "quantity", label: "Quantity", type: "number" },
  { id: "pickup", label: "Pickup Location", type: "text" },
  { id: "delivery", label: "Delivery Location", type: "text" },
]

export function ShipmentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    senderName: "",
    category: "",
    weight: "",
    quantity: "",
    pickup: "",
    delivery: ""
  })

  const handleChange = (id: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    router.push("/recommendations")
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      {/* Subtle glow effect */}
      <div className="absolute -z-10 inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-30 blur-xl" />
      
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-md mx-auto relative z-10 p-6 rounded-2xl border border-white/10 bg-[#020617]/80 backdrop-blur-md"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {formFields.map((field, index) => (
          <motion.div
            key={field.id}
            className="space-y-2"
            variants={item}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 24,
              delay: index * 0.1 
            }}
          >
            <Label htmlFor={field.id} className="text-blue-200">{field.label}</Label>
            {field.type === "select" ? (
              <Select 
                required
                onValueChange={(value) => handleChange(field.id, value)}
              >
                <SelectTrigger 
                  id={field.id}
                  className="border-white/10 bg-white/5 text-white focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-white/20"
                >
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-[#020617] border border-white/10 text-white">
                  <SelectItem value="documents" className="focus:bg-blue-500/20">Documents</SelectItem>
                  <SelectItem value="heavyCargo" className="focus:bg-blue-500/20">Heavy Cargo</SelectItem>
                  <SelectItem value="perishable" className="focus:bg-blue-500/20">Perishable</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <motion.div
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required
                  min={field.type === "number" ? "0" : undefined}
                  step={field.type === "number" ? (field.id === "weight" ? "0.1" : "1") : undefined}
                  className="border-white/10 bg-white/5 text-white focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-white/20"
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  value={formState[field.id as keyof typeof formState]}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
        
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 relative overflow-hidden group" 
            disabled={loading}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </motion.div>
              ) : (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Get Route Recommendations
                  <motion.div
                    className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Button glow effect */}
            <motion.div 
              className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/60 to-indigo-600/60 opacity-0 group-hover:opacity-100 blur-md transition-opacity"
              animate={{ scale: loading ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: loading ? Infinity : 0, duration: 1.5 }}
            />
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}