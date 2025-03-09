"use client"

import { FC, FormEvent, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Package, ArrowRight, Check } from "lucide-react"
import { RouteMap } from "@/components/InteractiveRouteMap" // Import the RouteMap component
import { type Route } from "@/components/InteractiveRouteMap" // Import the Route type

// Define form field interface
interface FormField {
  id: "senderName" | "category" | "weight" | "quantity" | "pickup" | "delivery";
  label: string;
  type: "text" | "select" | "number";
}

// Define form state interface
interface FormState {
  senderName: string;
  category: string;
  weight: string;
  quantity: string;
  pickup: string;
  delivery: string;
}

const formFields: FormField[] = [
  { id: "senderName", label: "Sender Name", type: "text" },
  { id: "category", label: "Shipment Category", type: "select" },
  { id: "weight", label: "Weight (kg)", type: "number" },
  { id: "quantity", label: "Quantity", type: "number" },
  { id: "pickup", label: "Pickup Location", type: "text" },
  { id: "delivery", label: "Delivery Location", type: "text" },
]

// List of locations for the autocomplete
const locationSuggestions = [
  "Los Angeles, USA",
  "New York, USA",
  "London, UK",
  "Tokyo, Japan",
  "Singapore",
  "Dubai, UAE",
  "Sydney, Australia",
  "Mumbai, India",
  "Shanghai, China"
];

export const ShipmentForm: FC = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [formState, setFormState] = useState<FormState>({
    senderName: "",
    category: "",
    weight: "",
    quantity: "",
    pickup: "",
    delivery: ""
  })
  const [currentStep, setCurrentStep] = useState<"form" | "map" | "success">("form")
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)

  const handleChange = (id: keyof FormState, value: string): void => {
    setFormState(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setLoading(true)
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setLoading(false)
    setCurrentStep("map")
  }
  
  const handleSelectRoute = (route: Route): void => {
    setSelectedRoute(route)
    setCurrentStep("success")
    
    // Show success message for a few seconds
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)
  }
  
  const handleGoBack = (): void => {
    if (currentStep === "map") {
      setCurrentStep("form")
    } else if (currentStep === "success") {
      setCurrentStep("map")
    }
  }
  
  const handleReset = (): void => {
    setFormState({
      senderName: "",
      category: "",
      weight: "",
      quantity: "",
      pickup: "",
      delivery: ""
    })
    setCurrentStep("form")
    setSelectedRoute(null)
  }

  // Animation variants
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
  
  // Get location suggestions as user types
  const getLocationSuggestions = (fieldId: keyof FormState): string[] => {
    const value = formState[fieldId].toLowerCase();
    if (!value) return [];
    
    return locationSuggestions
      .filter(loc => loc.toLowerCase().includes(value))
      .slice(0, 3); // Return top 3 matches
  };
  
  const pickupSuggestions = getLocationSuggestions("pickup");
  const deliverySuggestions = getLocationSuggestions("delivery");

  // Form Step
  if (currentStep === "form") {
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
                  value={formState[field.id]}
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
                  className="relative"
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
                    value={formState[field.id]}
                  />
                  
                  {/* Location suggestions */}
                  {field.id === "pickup" && pickupSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-[#020617] border border-white/10 shadow-lg">
                      {pickupSuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-500/20"
                          onClick={() => handleChange(field.id, suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.id === "delivery" && deliverySuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-[#020617] border border-white/10 shadow-lg">
                      {deliverySuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-500/20"
                          onClick={() => handleChange(field.id, suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
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
  
  // Map Step - Integrated RouteMap component
  if (currentStep === "map") {
    return (
      <div className="relative">
        <RouteMap 
          formData={formState} 
          onSelectRoute={handleSelectRoute} 
          onGoBack={handleGoBack}
        />
      </div>
    )
  }
  
  // Success Step
  if (currentStep === "success") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="absolute -z-10 inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-30 blur-xl" />
        
        <motion.div
          className="space-y-6 max-w-md mx-auto relative z-10 p-6 rounded-2xl border border-white/10 bg-[#020617]/80 backdrop-blur-md text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />
              </svg>
            </motion.div>
          </motion.div>
          
          <motion.h2
            variants={item}
            className="text-2xl font-bold text-white"
          >
            Shipment Confirmed!
          </motion.h2>
          
          <motion.p
            variants={item}
            className="text-blue-200/70"
          >
            Your shipment has been scheduled using the {selectedRoute?.route_name} route. 
            Track your shipment in real-time from your dashboard.
          </motion.p>
          
          <motion.div
            variants={item}
            className="p-4 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-xs text-blue-200/50">TRACKING ID</p>
                <p className="font-semibold">{Math.floor(1000000 + Math.random() * 9000000)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200/50">ESTIMATED ARRIVAL</p>
                <p className="font-semibold">
                  {new Date(Date.now() + (2 + (selectedRoute?.total_transit_time_hours || 0)/24)*24*60*60*1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Success notification */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
              >
                Shipment successfully scheduled!
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button 
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Schedule Another Shipment
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }
  
  // TypeScript requires a return even though all conditions are handled
  return null;
}