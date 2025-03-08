"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CsvUploadForm } from "@/components/csv-upload-form"
import { ShipmentForm } from "@/components/shipment-form"
import { Ship, FileSpreadsheet } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { motion } from "framer-motion"
import { SetStateAction, useState } from "react"

const Home = () => {
  const [activeTab, setActiveTab] = useState("batch")
  
  const handleValueChange = (value: SetStateAction<string>) => {
    setActiveTab(value)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection/>
      <section className="container py-12 bg-[#020617] md:py-16 lg:py-20">
        <Tabs defaultValue="batch" className="mx-auto max-w-4xl" onValueChange={handleValueChange}>
          <TabsList className="grid w-full grid-cols-2 p-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <motion.div
              whileHover={{ scale: activeTab === "batch" ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full"
            >
              <TabsTrigger
                value="batch"
                className={`
                  relative flex items-center justify-center gap-2 rounded-full py-3 w-full
                  transition-all duration-200 ease-out overflow-hidden
                  ${activeTab === "batch" 
                    ? "text-white shadow-inner bg-gradient-to-br from-blue-600/20 to-indigo-600/20" 
                    : "text-blue-200/80 hover:text-white"}
                `}
              >
                {/* Pseudo-3D effect for pressed state */}
                <div className={`
                  absolute inset-0 rounded-full transition-opacity duration-200
                  bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-white/5
                  ${activeTab === "batch" ? 'opacity-100' : 'opacity-0'}
                `} />
                
                {/* Subtle glow effect when active */}
                {activeTab === "batch" && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-md" />
                )}
                
                {/* Content */}
                <div className="relative flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Batch Upload</span>
                </div>
              </TabsTrigger>
            </motion.div>

            <motion.div
              whileHover={{ scale: activeTab === "single" ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full"
            >
              <TabsTrigger
                value="single"
                className={`
                  relative flex items-center justify-center gap-2 rounded-full py-3 w-full
                  transition-all duration-200 ease-out overflow-hidden
                  ${activeTab === "single" 
                    ? "text-white shadow-inner bg-gradient-to-br from-blue-600/20 to-indigo-600/20" 
                    : "text-blue-200/80 hover:text-white"}
                `}
              >
                {/* Pseudo-3D effect for pressed state */}
                <div className={`
                  absolute inset-0 rounded-full transition-opacity duration-200
                  bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-white/5
                  ${activeTab === "single" ? 'opacity-100' : 'opacity-0'}
                `} />
                
                {/* Subtle glow effect when active */}
                {activeTab === "single" && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-md" />
                )}
                
                {/* Content */}
                <div className="relative flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  <span>Single Shipment</span>
                </div>
              </TabsTrigger>
            </motion.div>
          </TabsList>
          
          <TabsContent 
            value="batch" 
            className="mt-8 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl p-6 text-white shadow-lg"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-semibold mb-4">Upload Shipment Batch</h3>
              <p className="mb-6 text-blue-200/70">
                Upload a CSV file with multiple shipments to get optimized routes and clusters.
              </p>
              <CsvUploadForm/>
            </motion.div>
          </TabsContent>
          
          <TabsContent 
            value="single" 
            className="mt-8 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl p-6 text-white shadow-lg"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-semibold mb-4">Enter Shipment Details</h3>
              <p className="mb-6 text-blue-200/70">
                Enter details for a single shipment to get 7 possible route options.
              </p>
              <ShipmentForm/>
            </motion.div>
          </TabsContent>
        </Tabs>
      </section>

      <footer className="border-t border-white/10 py-6 bg-[#020617] text-white">
        <div className="container text-center text-sm text-blue-200/60">
          &copy; {new Date().getFullYear()} CargoRoute Optimizer. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default Home;