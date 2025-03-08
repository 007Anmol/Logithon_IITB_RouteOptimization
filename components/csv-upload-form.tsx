"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react"

export function CsvUploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError("Please upload a CSV file")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Please upload a CSV file")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsUploading(true)
    setError(null)

    // Simulate file upload with progress
    const totalTime = 3000 // 3 seconds for simulation
    const interval = 50 // Update every 50ms
    const steps = totalTime / interval
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep++
      setUploadProgress(Math.min((currentStep / steps) * 100, 100))

      if (currentStep >= steps) {
        clearInterval(progressInterval)
        // Simulate processing time
        setTimeout(() => {
          setIsUploading(false)
          // In a real app, you would redirect to results page after successful processing
          router.push("/batch-results?id=sample123")
        }, 500)
      }
    }, interval)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative bg-[#020617] rounded-2xl p-6"
    >
      {/* Subtle glow effect */}
      <div className="absolute -z-10 inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-30 blur-xl" />
      
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6 relative z-10 p-6 rounded-2xl border border-white/10 bg-[#020617]/80 backdrop-blur-md"
      >
        <motion.div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging 
              ? "border-blue-400 bg-blue-500/10" 
              : "border-white/20 hover:border-white/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ boxShadow: "0 0 20px 0 rgba(59, 130, 246, 0.3)" }}
        >
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-0.5 rounded-full inline-block">
                    <div className="bg-[#020617] p-3 rounded-full">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                  </div>
                </motion.div>
                <p className="text-lg font-medium text-white">{file.name}</p>
                <p className="text-sm text-blue-200/70">{(file.size / 1024).toFixed(2)} KB</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFile(null)} 
                  className="mt-2 border-white/20 text-whitebg-white/10 "
                >
                  Change File
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-0.5 rounded-full inline-block">
                    <div className="bg-[#020617] p-3 rounded-full">
                      <Upload className="h-10 w-10 text-blue-400" />
                    </div>
                  </div>
                </motion.div>
                <div>
                  <p className="text-lg font-medium text-white">Drag and drop your CSV file here</p>
                  <p className="text-sm text-blue-200/70 mt-1">or click to browse files</p>
                </div>
                <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById("csv-upload")?.click()}
                  className="border-white/20 text-white bg-white/20"
                >
                  Browse Files
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isUploading && (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="flex justify-between text-sm text-blue-200">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="flex justify-end"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            type="submit" 
            disabled={!file || isUploading} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
          >
            {isUploading ? "Processing..." : "Upload and Process"}
          </Button>
        </motion.div>

        <motion.div 
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-sm text-blue-200/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <p className="font-medium text-white">CSV Format Requirements:</p>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>First row must contain headers</li>
            <li>Required columns: Origin, Destination, Weight, Dimensions</li>
            <li>Maximum file size: 10MB</li>
            <li>Up to 1000 shipments per file</li>
          </ul>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}