"use client";
import { FC, useState, useRef, ChangeEvent, DragEvent, FormEvent } from "react";

import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Download,
  Package,
  Loader2,
  X,
  ArrowRight,
  Info,
  FileCog,
  Database,
  FileCheck,
} from "lucide-react";

import Papa from "papaparse";

import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  Shipment,
  ShipmentUploadResult,
  OptimizationStatus,
  ProcessStep,
} from "@/types/batch-shipping";

// Initial process steps

const initialProcessSteps: ProcessStep[] = [
  {
    id: "upload",
    name: "Upload CSV",
    description: "Upload your shipment data file",
    status: "pending",
    percentage: 0,
  },

  {
    id: "validate",
    name: "Validate Data",
    description: "Check data format and constraints",
    status: "pending",
    percentage: 0,
  },

  {
    id: "optimize",
    name: "Optimize Routes",
    description: "Calculate optimal shipping routes",
    status: "pending",
    percentage: 0,
  },

  {
    id: "complete",
    name: "Generate Results",
    description: "Prepare visualization and reports",
    status: "pending",
    percentage: 0,
  },
];

export const CsvUploadForm: FC = () => {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<ShipmentUploadResult | null>(
    null
  );

  const [showDataPreview, setShowDataPreview] = useState<boolean>(false);

  const [optimizationStatus, setOptimizationStatus] =
    useState<OptimizationStatus>("idle");

  const [processSteps, setProcessSteps] =
    useState<ProcessStep[]>(initialProcessSteps);

  const [showSampleDialog, setShowSampleDialog] = useState<boolean>(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();

    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();

    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      if (
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile);

        setError(null);

        // Parse the CSV file

        parseCsvFile(droppedFile);
      } else {
        setError("Please upload a CSV file");
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);

        setError(null);

        // Parse the CSV file

        parseCsvFile(selectedFile);
      } else {
        setError("Please upload a CSV file");
      }
    }
  };

  // Function to parse the CSV file

  const parseCsvFile = (file: File): void => {
    // Reset any existing parsed data

    setParsedData(null);

    Papa.parse<Papa.LocalFile>(file, {
      header: true,

      skipEmptyLines: true,

      dynamicTyping: true,

      complete: (results: { data: any[]; }) => {
        try {
          // Process the parsed results

          const errors: { row: number; message: string }[] = [];

          const shipments: Shipment[] = [];

          if (Array.isArray(results.data)) {
            results.data.forEach((row: any, index: number) => {
              try {
                // Validate required fields

                if (!row.origin || !row.destination || !row.weight) {
                  errors.push({
                    row: index + 2, // +2 because index is 0-based and we skip the header row

                    message:
                      "Missing required field (origin, destination, or weight)",
                  });

                  return;
                }

                // Create shipment object

                const shipment: Shipment = {
                  id: `shipment-${index + 1}`,

                  origin: String(row.origin || ""),

                  destination: String(row.destination || ""),

                  weight: parseFloat(String(row.weight)) || 0,

                  dimensions: String(row.dimensions || "30x40x20"), // Default dimensions if not provided

                  description: String(row.description || ""),

                  priority:
                    row.priority === "high" ||
                    row.priority === "medium" ||
                    row.priority === "low"
                      ? row.priority
                      : "medium",

                  deadline: String(row.deadline || ""),

                  fragile:
                    row.fragile === "true" || row.fragile === true || false,

                  hazardous:
                    row.hazardous === "true" || row.hazardous === true || false,

                  temperature: row.temperature
                    ? {
                        min:
                          typeof row.temperature.min === "number"
                            ? row.temperature.min
                            : 0,

                        max:
                          typeof row.temperature.max === "number"
                            ? row.temperature.max
                            : 30,
                      }
                    : undefined,
                };

                // Basic validation

                if (shipment.weight <= 0) {
                  errors.push({
                    row: index + 2,

                    message: "Weight must be greater than 0",
                  });

                  return;
                }

                shipments.push(shipment);
              } catch (err) {
                errors.push({
                  row: index + 2,

                  message: `Error processing row: ${
                    err instanceof Error ? err.message : String(err)
                  }`,
                });
              }
            });
          }

          // Update parsed data state

          setParsedData({
            shipments,

            validCount: shipments.length,

            invalidCount: errors.length,

            errors,

            fileName: file.name,

            fileSize: file.size,
          });

          // Update the upload step

          updateProcessStep("upload", "complete", 100);

          // Start validation step

          updateProcessStep("validate", "processing", 0);

          // Simulate validation process

          startValidationProcess();
        } catch (err) {
          setError(
            `Error parsing CSV: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      },

      error: (error: Error, file: Papa.LocalFile) => {
        setError(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  // Simulate validation process

  const startValidationProcess = (): void => {
    setTimeout(() => {
      const validationProgress = setInterval(() => {
        setProcessSteps((prev) => {
          const updatedSteps = [...prev];

          const validateStep = updatedSteps.find(
            (step) => step.id === "validate"
          );

          if (validateStep && validateStep.percentage < 100) {
            validateStep.percentage += 10;

            if (validateStep.percentage >= 100) {
              validateStep.status = "complete";

              clearInterval(validationProgress);

              // Move to optimization step

              setTimeout(() => {
                updateProcessStep("optimize", "processing", 0);

                startOptimization();
              }, 500);
            }
          }

          return updatedSteps;
        });
      }, 100);
    }, 500);
  };

  // Update a process step

  const updateProcessStep = (
    id: string,

    status: "pending" | "processing" | "complete" | "error",

    percentage: number
  ): void => {
    setProcessSteps((prev) => {
      return prev.map((step) => {
        if (step.id === id) {
          return { ...step, status, percentage };
        }

        return step;
      });
    });
  };

  // Start the optimization process

  const startOptimization = (): void => {
    if (!parsedData) return;

    setOptimizationStatus("optimizing");

    // Simulate optimization process with progress updates

    let progress = 0;

    const optimizationProgress = setInterval(() => {
      progress += 5;

      updateProcessStep("optimize", "processing", progress);

      if (progress >= 100) {
        clearInterval(optimizationProgress);

        updateProcessStep("optimize", "complete", 100);

        // Move to final step

        setTimeout(() => {
          updateProcessStep("complete", "processing", 0);

          // Simulate final step

          let finalProgress = 0;

          const finalStep = setInterval(() => {
            finalProgress += 10;

            updateProcessStep("complete", "processing", finalProgress);

            if (finalProgress >= 100) {
              clearInterval(finalStep);

              updateProcessStep("complete", "complete", 100);

              // Complete the process

              setOptimizationStatus("complete");

              // Navigate to results page

              setTimeout(() => {
                router.push("/batch-results?id=sample123");
              }, 1000);
            }
          }, 100);
        }, 500);
      }
    }, 150);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");

      return;
    }

    if (!parsedData) {
      setError("Unable to parse CSV data");

      return;
    }

    setIsUploading(true);

    setError(null);

    setOptimizationStatus("processing");

    // Start optimization process

    startOptimization();
  };

  const downloadSampleCsv = (): void => {
    const sampleData = [
      [
        "origin",
        "destination",
        "weight",
        "dimensions",
        "description",
        "priority",
        "deadline",
        "fragile",
        "hazardous",
      ],

      [
        "Los Angeles, USA",
        "New York, USA",
        "450",
        "50x40x30",
        "Electronics",
        "high",
        "2023-12-25",
        "true",
        "false",
      ],

      [
        "New York, USA",
        "London, UK",
        "1200",
        "120x80x75",
        "Machinery parts",
        "medium",
        "2023-12-30",
        "false",
        "false",
      ],

      [
        "Los Angeles, USA",
        "Tokyo, Japan",
        "850",
        "90x60x40",
        "Medical supplies",
        "high",
        "2023-12-20",
        "true",
        "false",
      ],

      [
        "New York, USA",
        "Mumbai, India",
        "1500",
        "100x80x60",
        "Industrial equipment",
        "medium",
        "2024-01-15",
        "false",
        "false",
      ],

      [
        "London, UK",
        "Singapore",
        "720",
        "85x55x45",
        "Fashion merchandise",
        "low",
        "2024-01-10",
        "false",
        "false",
      ],

      [
        "Tokyo, Japan",
        "Sydney, Australia",
        "950",
        "110x70x50",
        "Automotive parts",
        "medium",
        "2024-01-05",
        "false",
        "true",
      ],

      [
        "Shanghai, China",
        "Frankfurt, Germany",
        "1100",
        "130x90x70",
        "Consumer electronics",
        "high",
        "2023-12-28",
        "true",
        "false",
      ],

      [
        "Dubai, UAE",
        "São Paulo, Brazil",
        "1300",
        "140x95x80",
        "Oil equipment",
        "medium",
        "2024-01-20",
        "false",
        "true",
      ],

      [
        "Mexico City, Mexico",
        "Madrid, Spain",
        "680",
        "75x50x40",
        "Textiles",
        "low",
        "2024-01-25",
        "false",
        "false",
      ],

      [
        "Hong Kong",
        "Paris, France",
        "790",
        "85x60x50",
        "Luxury goods",
        "high",
        "2023-12-22",
        "true",
        "false",
      ],

      [
        "Toronto, Canada",
        "Delhi, India",
        "980",
        "100x70x60",
        "Agricultural machinery",
        "medium",
        "2024-01-18",
        "false",
        "false",
      ],

      [
        "Seoul, South Korea",
        "Moscow, Russia",
        "1050",
        "120x80x70",
        "Electronics components",
        "medium",
        "2024-01-12",
        "true",
        "false",
      ],

      [
        "Bangkok, Thailand",
        "Cairo, Egypt",
        "870",
        "95x65x55",
        "Food products",
        "high",
        "2023-12-18",
        "false",
        "false",
      ],

      [
        "Jakarta, Indonesia",
        "Amsterdam, Netherlands",
        "1150",
        "130x85x75",
        "Furniture",
        "low",
        "2024-01-28",
        "false",
        "false",
      ],
    ];

    // Convert to CSV

    const csvContent = sampleData.map((row) => row.join(",")).join("\n");

    // Create a download link

    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "sample_shipments.csv";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  // Get the current active step

  const currentStep =
    processSteps.find((step) => step.status === "processing")?.id ||
    (parsedData ? "validate" : "upload");

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
        {/* Process steps */}

        {optimizationStatus !== "idle" && (
          <div className="mb-6">
            <div className="flex mb-2 justify-between items-center">
              <h3 className="text-sm font-medium text-white">
                Optimization Progress
              </h3>

              <span className="text-xs text-blue-200/70">
                {optimizationStatus === "complete"
                  ? "Completed"
                  : "Processing..."}
              </span>
            </div>

            <div className="space-y-4">
              {processSteps.map((step) => (
                <div key={step.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center ${
                          step.status === "complete"
                            ? "bg-green-500/20 text-green-400"
                            : step.status === "processing"
                            ? "bg-blue-500/20 text-blue-400"
                            : step.status === "error"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {step.status === "complete" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : step.status === "processing" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Loader2 className="h-3 w-3" />
                          </motion.div>
                        ) : step.status === "error" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-xs font-medium ${
                            step.status === "complete"
                              ? "text-green-400"
                              : step.status === "processing"
                              ? "text-blue-400"
                              : step.status === "error"
                              ? "text-red-400"
                              : "text-white/60"
                          }`}
                        >
                          {step.name}
                        </p>

                        <p className="text-[10px] text-blue-200/50">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-blue-200/70">
                      {step.percentage}%
                    </span>
                  </div>

                  <Progress
                    value={step.percentage}
                    className={`h-1 bg-white/10 ${
                      step.status === "complete"
                        ? "bg-green-500"
                        : step.status === "processing"
                        ? "bg-blue-500"
                        : step.status === "error"
                        ? "bg-red-500"
                        : "bg-white/20"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area */}

        {(!file || !parsedData) && (
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
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: 0.1,
                    }}
                  >
                    <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-0.5 rounded-full inline-block">
                      <div className="bg-[#020617] p-3 rounded-full">
                        <CheckCircle className="h-10 w-10 text-green-400" />
                      </div>
                    </div>
                  </motion.div>

                  <p className="text-lg font-medium text-white">{file.name}</p>

                  <p className="text-sm text-blue-200/70">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFile(null)}
                    className="mt-2 border-white/20 text-white bg-white/10"
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
                    <p className="text-lg font-medium text-white">
                      Drag and drop your CSV file here
                    </p>

                    <p className="text-sm text-blue-200/70 mt-1">
                      or click to browse files
                    </p>
                  </div>

                  <input
                    type="file"
                    id="csv-upload"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/20 text-white bg-white/5"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Browse Files
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSampleDialog(true)}
                      className="border-white/20 text-white bg-white/5"
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Sample
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Data preview */}

        {parsedData && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-400" />

                <div>
                  <h3 className="font-medium text-white">CSV File Parsed</h3>

                  <p className="text-xs text-blue-200/70">
                    {parsedData.validCount} valid shipments
                    {parsedData.invalidCount > 0 &&
                      ` (${parsedData.invalidCount} errors)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataPreview(!showDataPreview)}
                  className="text-xs border-white/20 text-white bg-white/5"
                >
                  {showDataPreview ? "Hide Preview" : "Show Preview"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);

                    setParsedData(null);

                    setProcessSteps(initialProcessSteps);

                    setOptimizationStatus("idle");
                  }}
                  className="text-xs border-white/20 text-white bg-white/5"
                >
                  Change File
                </Button>
              </div>
            </div>

            {showDataPreview && (
              <div className="mb-4 p-4 rounded-lg border border-white/10 bg-white/5 max-h-60 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          ID
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          Origin
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          Destination
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          Weight
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          Dimensions
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          Priority
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {parsedData.shipments.slice(0, 5).map((shipment) => (
                        <tr
                          key={shipment.id}
                          className="border-b border-white/10"
                        >
                          <td className="px-2 py-1 text-blue-200/60">
                            {shipment.id.slice(0, 10)}
                          </td>

                          <td className="px-2 py-1 text-blue-200/60">
                            {shipment.origin}
                          </td>

                          <td className="px-2 py-1 text-blue-200/60">
                            {shipment.destination}
                          </td>

                          <td className="px-2 py-1 text-blue-200/60">
                            {shipment.weight} kg
                          </td>

                          <td className="px-2 py-1 text-blue-200/60">
                            {shipment.dimensions}
                          </td>

                          <td className="px-2 py-1 text-blue-200/60">
                            <Badge
                              variant="outline"
                              className={`

                text-[10px] px-1 py-0 

                ${
                  shipment.priority === "high"
                    ? "bg-red-500/10 text-red-300 border-red-300/30"
                    : shipment.priority === "medium"
                    ? "bg-amber-500/10 text-amber-300 border-amber-300/30"
                    : "bg-blue-500/10 text-blue-300 border-blue-300/30"
                }

               `}
                            >
                              {shipment.priority}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedData.shipments.length > 5 && (
                  <div className="mt-2 text-center text-xs text-blue-200/60">
                    + {parsedData.shipments.length - 5} more shipments
                  </div>
                )}

                {parsedData.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-yellow-400 mb-2">
                      Errors & Warnings
                    </h4>

                    <div className="space-y-1">
                      {parsedData.errors.slice(0, 3).map((error, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs"
                        >
                          <AlertCircle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />

                          <span className="text-yellow-200/70">
                            Row {error.row}: {error.message}
                          </span>
                        </div>
                      ))}

                      {parsedData.errors.length > 3 && (
                        <div className="text-xs text-blue-200/60">
                          + {parsedData.errors.length - 3} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert
              variant="default"
              className="mb-4 bg-blue-900/20 border-blue-500/30"
            >
              <Database className="h-4 w-4 text-blue-400" />

              <AlertTitle className="text-sm font-medium text-white">
                Ready to optimize
              </AlertTitle>

              <AlertDescription className="text-xs text-blue-200/70">
                {parsedData.validCount} shipments will be processed for route
                optimization. This will identify cost-saving opportunities
                through clustering, multi-modal transport, and backhaul
                optimization.
              </AlertDescription>
            </Alert>
          </div>
        )}

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

        <motion.div
          className="flex justify-between items-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/20 text-white bg-white/5"
                  onClick={downloadSampleCsv}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span> Sample CSV
                </Button>
              </TooltipTrigger>

              <TooltipContent className="bg-black/80 border-white/10 text-xs">
                <p>Download a sample CSV template</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            type="submit"
            disabled={
              !parsedData || isUploading || optimizationStatus !== "idle"
            }
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
          >
            {optimizationStatus !== "idle" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileCog className="h-4 w-4" />
                Optimize Routes
              </>
            )}
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

          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>First row must contain headers</li>

            <li>Required columns: origin, destination, weight</li>

            <li>
              Optional columns: dimensions, description, priority, deadline,
              fragile, hazardous
            </li>

            <li>Weight should be specified in kilograms</li>

            <li>Dimensions should be in format: LxWxH (cm)</li>

            <li>Maximum file size: 10MB</li>
          </ul>
        </motion.div>
      </motion.form>

      {/* Sample CSV Dialog */}

      <Dialog open={showSampleDialog} onOpenChange={setShowSampleDialog}>
        <DialogContent className="bg-[#020617]/90 border-white/10 backdrop-blur-md text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Sample CSV Format</DialogTitle>

            <DialogDescription className="text-blue-200/70">
              Use this format for your shipment data CSV file
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="preview">Preview</TabsTrigger>

              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto p-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          origin
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          destination
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          weight
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          dimensions
                        </th>

                        <th className="px-2 py-1 text-left font-medium text-blue-200/80">
                          priority
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="px-2 py-1 text-blue-200/60">
                          Los Angeles, USA
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">
                          New York, USA
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">450</td>

                        <td className="px-2 py-1 text-blue-200/60">50x40x30</td>

                        <td className="px-2 py-1 text-blue-200/60">high</td>
                      </tr>

                      <tr className="border-b border-white/10">
                        <td className="px-2 py-1 text-blue-200/60">
                          New York, USA
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">
                          London, UK
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">1200</td>

                        <td className="px-2 py-1 text-blue-200/60">
                          120x80x75
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">medium</td>
                      </tr>

                      <tr className="border-b border-white/10">
                        <td className="px-2 py-1 text-blue-200/60">
                          Los Angeles, USA
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">
                          Tokyo, Japan
                        </td>

                        <td className="px-2 py-1 text-blue-200/60">850</td>

                        <td className="px-2 py-1 text-blue-200/60">90x60x40</td>

                        <td className="px-2 py-1 text-blue-200/60">high</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-4 text-xs text-blue-200/70">
                This is a preview of how your CSV data should be formatted. The
                headers are required, and each row represents a single shipment
                to be optimized.
              </p>
            </TabsContent>

            <TabsContent value="template" className="mt-4 space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-medium mb-2">Required Columns:</p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">origin</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Pickup location
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">destination</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Delivery location
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">weight</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Weight in kg
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-medium mb-2">Optional Columns:</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">dimensions</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Format: LxWxH in cm
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">description</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Item description
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">priority</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      low, medium, high
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">deadline</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      Format: YYYY-MM-DD
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">fragile</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      true/false
                    </p>
                  </div>

                  <div className="p-2 rounded bg-white/10 text-xs">
                    <span className="font-medium">hazardous</span>

                    <p className="text-[10px] text-blue-200/60 mt-1">
                      true/false
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={downloadSampleCsv}>
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
