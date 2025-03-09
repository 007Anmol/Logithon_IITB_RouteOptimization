"use client"
import { FC, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Package, ArrowLeft, Download, Share, FileBarChart,
  Filter, Save, Zap, Leaf, DollarSign, Ship, Plane, Truck,
  Layers, Eye, EyeOff, MapPin, ChevronsUpDown, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchRouteMap } from "@/components/batch-route-map"
import { 
  BatchOptimizationResult, 
  OptimizedRoute,
  RouteSegment,
  Shipment
} from "@/types/batch-shipping"
import { BatchRouteOptimizer } from "@/utils/batch-route-optimizer"

// Sample shipments data (normally would be retrieved from backend)
const generateSampleShipments = (): Shipment[] => {
  return [
    {
      id: "shipment-1",
      origin: "Los Angeles, USA",
      destination: "New York, USA",
      weight: 450,
      dimensions: "50x40x30",
      description: "Electronics",
      priority: "high",
      deadline: "2023-12-25",
      fragile: true,
      hazardous: false
    },
    {
      id: "shipment-2",
      origin: "New York, USA",
      destination: "London, UK",
      weight: 1200,
      dimensions: "120x80x75",
      description: "Machinery parts",
      priority: "medium",
      deadline: "2023-12-30"
    },
    {
      id: "shipment-3",
      origin: "Los Angeles, USA",
      destination: "Tokyo, Japan",
      weight: 850,
      dimensions: "90x60x40",
      description: "Medical supplies",
      priority: "high",
      deadline: "2023-12-20",
      fragile: true
    },
    {
      id: "shipment-4",
      origin: "New York, USA",
      destination: "Mumbai, India",
      weight: 1500,
      dimensions: "100x80x60",
      description: "Industrial equipment",
      priority: "medium",
      deadline: "2024-01-15"
    },
    {
      id: "shipment-5",
      origin: "London, UK",
      destination: "Singapore",
      weight: 720,
      dimensions: "85x55x45",
      description: "Fashion merchandise",
      priority: "low",
      deadline: "2024-01-10"
    },
    {
      id: "shipment-6",
      origin: "Tokyo, Japan",
      destination: "Sydney, Australia",
      weight: 950,
      dimensions: "110x70x50",
      description: "Automotive parts",
      priority: "medium",
      deadline: "2024-01-05",
      hazardous: true
    },
    {
      id: "shipment-7",
      origin: "Shanghai, China",
      destination: "Frankfurt, Germany",
      weight: 1100,
      dimensions: "130x90x70",
      description: "Consumer electronics",
      priority: "high",
      deadline: "2023-12-28",
      fragile: true
    },
    {
      id: "shipment-8",
      origin: "Dubai, UAE",
      destination: "São Paulo, Brazil",
      weight: 1300,
      dimensions: "140x95x80",
      description: "Oil equipment",
      priority: "medium",
      deadline: "2024-01-20",
      hazardous: true
    },
    {
      id: "shipment-9",
      origin: "Mexico City, Mexico",
      destination: "Madrid, Spain",
      weight: 680,
      dimensions: "75x50x40",
      description: "Textiles",
      priority: "low",
      deadline: "2024-01-25"
    },
    {
      id: "shipment-10",
      origin: "Hong Kong",
      destination: "Paris, France",
      weight: 790,
      dimensions: "85x60x50",
      description: "Luxury goods",
      priority: "high",
      deadline: "2023-12-22",
      fragile: true
    },
    {
      id: "shipment-11",
      origin: "Toronto, Canada",
      destination: "Delhi, India",
      weight: 980,
      dimensions: "100x70x60",
      description: "Agricultural machinery",
      priority: "medium",
      deadline: "2024-01-18"
    },
    {
      id: "shipment-12",
      origin: "Seoul, South Korea",
      destination: "Moscow, Russia",
      weight: 1050,
      dimensions: "120x80x70",
      description: "Electronics components",
      priority: "medium",
      deadline: "2024-01-12",
      fragile: true
    },
    {
      id: "shipment-13",
      origin: "Bangkok, Thailand",
      destination: "Cairo, Egypt",
      weight: 870,
      dimensions: "95x65x55",
      description: "Food products",
      priority: "high",
      deadline: "2023-12-18"
    },
    {
      id: "shipment-14",
      origin: "Jakarta, Indonesia",
      destination: "Amsterdam, Netherlands",
      weight: 1150,
      dimensions: "130x85x75",
      description: "Furniture",
      priority: "low",
      deadline: "2024-01-28"
    },
    {
      id: "shipment-15",
      origin: "Los Angeles, USA",
      destination: "Delhi, India",
      weight: 920,
      dimensions: "100x70x60",
      description: "Computer equipment",
      priority: "high",
      deadline: "2023-12-15",
      fragile: true
    }
  ];
};

// Generate the optimization result
const generateOptimizationResult = (shipments: Shipment[]): BatchOptimizationResult => {
  // Use the BatchRouteOptimizer to generate optimized routes
  const routes = BatchRouteOptimizer.optimizeRoutes(shipments);
  
  // Calculate summary metrics
  const totalShipments = shipments.length;
  const totalVehicles = routes.reduce((sum, route) => sum + route.vehicles.length, 0);
  const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
  const totalCost = routes.reduce((sum, route) => sum + route.totalCost, 0);
  const totalTime = routes.reduce((sum, route) => sum + route.totalTime, 0);
  const totalCO2 = routes.reduce((sum, route) => sum + route.totalCO2, 0);
  
  // Calculate baseline costs (as if each shipment was sent individually)
  const individualShipmentCost = shipments.reduce((sum, shipment) => {
    // Simple baseline calculation
    const distance = 
      BatchRouteOptimizer['calculateDistance'](
        BatchRouteOptimizer['getLocationCoordinates'](shipment.origin) || { lat: 0, lng: 0 },
        BatchRouteOptimizer['getLocationCoordinates'](shipment.destination) || { lat: 0, lng: 0 }
      );
    
    // Simplified cost model for comparison
    const mode = BatchRouteOptimizer['selectOptimalTransportMode'](
      shipment.origin, 
      shipment.destination, 
      distance
    );
    
    return sum + BatchRouteOptimizer['calculateModeCost'](mode, distance) * 1.5; // Higher cost for individual shipments
  }, 0);
  
  const costSavings = individualShipmentCost - totalCost;
  
  // Calculate CO2 savings (estimated)
  const individualCO2 = shipments.reduce((sum, shipment) => {
    const distance = 
      BatchRouteOptimizer['calculateDistance'](
        BatchRouteOptimizer['getLocationCoordinates'](shipment.origin) || { lat: 0, lng: 0 },
        BatchRouteOptimizer['getLocationCoordinates'](shipment.destination) || { lat: 0, lng: 0 }
      );
    
    const mode = BatchRouteOptimizer['selectOptimalTransportMode'](
      shipment.origin, 
      shipment.destination, 
      distance
    );
    
    return sum + BatchRouteOptimizer['calculateEmissions'](mode, distance) * 1.3; // Higher emissions for individual shipments
  }, 0);
  
  const co2Savings = individualCO2 - totalCO2;
  
  // Count clusters
  const clusterCount = new Set(routes.map(r => r.segments[r.segments.length - 1].to)).size;
  
  // Count multi-modal routes
  const multiModalCount = routes.filter(r => r.isMultiModal).length;
  
  // Count backhaul routes
  const backhaulCount = routes.filter(r => r.hasBackhaul).length;
  
  return {
    routes,
    totalShipments,
    totalVehicles,
    totalDistance,
    totalCost,
    totalTime,
    totalCO2,
    costSavings,
    co2Savings,
    clusterCount,
    multiModalCount,
    backhaulCount,
    generatedAt: new Date().toISOString()
  };
};

// Wrapper for applying the app-wide background
const AppLayout: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {children}
    </div>
  );
};

const BatchResultsPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("id");
  
  const [optimizationResult, setOptimizationResult] = useState<BatchOptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"map" | "details" | "shipments">("map");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  
  // Generate or fetch optimization results
  useEffect(() => {
    // Simulate API call to fetch results
    setIsLoading(true);
    
    // In a real app, you would fetch the data from your backend
    setTimeout(() => {
      const shipments = generateSampleShipments();
      const result = generateOptimizationResult(shipments);
      setOptimizationResult(result);
      setIsLoading(false);
    }, 1000);
  }, [batchId]);
  
  // Handle navigation back to upload
  const handleBackToUpload = () => {
    router.push("/");
  };
  
  // Handle route selection
  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(prev => prev === routeId ? null : routeId);
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-blue-200/80 font-medium">Loading optimization results...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!optimizationResult) {
    return (
      <AppLayout>
        <div className="container py-12">
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Results Not Found</h2>
            <p className="text-blue-200/70 mb-6">
              We couldn't find the optimization results for batch ID: {batchId || "unknown"}
            </p>
            <Button onClick={handleBackToUpload}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Extract metrics for display
  const { 
    totalShipments, 
    totalVehicles, 
    totalDistance, 
    totalCost, 
    costSavings, 
    co2Savings,
    clusterCount,
    multiModalCount,
    backhaulCount
  } = optimizationResult;
  
  // Get selected route
  const selectedRoute = selectedRouteId 
    ? optimizationResult.routes.find(r => r.id === selectedRouteId) 
    : null;
  
  // Count routes by mode
  const truckRoutes = optimizationResult.routes.filter(r => 
    r.segments.some(s => s.mode === "truck")
  ).length;
  
  const airRoutes = optimizationResult.routes.filter(r => 
    r.segments.some(s => s.mode === "plane")
  ).length;
  
  const seaRoutes = optimizationResult.routes.filter(r => 
    r.segments.some(s => s.mode === "ship")
  ).length;

  return (
    <AppLayout>
      <div className="container py-12">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToUpload}
                  className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-white">Route Optimization Results</h1>
              </div>
              <p className="text-blue-200/70 ml-10">
                Optimized routes for {totalShipments} shipments across {optimizationResult.routes.length} routes
              </p>
            </div>
            
            <div className="ml-10 md:ml-0 flex gap-2">
              <Button variant="outline" className="gap-2 border-white/20 text-white bg-white/5">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" className="gap-2 border-white/20 text-white bg-white/5">
                <Share className="h-4 w-4" />
                Share
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Save className="h-4 w-4" />
                Save Plan
              </Button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-blue-200/50">COST SAVINGS</p>
                  <p className="text-xl font-bold text-green-400">${costSavings.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500/30" />
              </div>
              <p className="text-xs text-blue-200/60 mt-1">
                Compared to individual shipments
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-blue-200/50">EMISSIONS REDUCTION</p>
                  <p className="text-xl font-bold text-green-400">{co2Savings.toLocaleString()} kg</p>
                </div>
                <Leaf className="h-8 w-8 text-green-500/30" />
              </div>
              <p className="text-xs text-blue-200/60 mt-1">
                CO₂ emissions saved
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-blue-200/50">OPTIMIZED ROUTES</p>
                  <p className="text-xl font-bold">{optimizationResult.routes.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500/30" />
              </div>
              <p className="text-xs text-blue-200/60 mt-1">
                Instead of {totalShipments} individual routes
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-blue-200/50">VEHICLES USED</p>
                  <p className="text-xl font-bold">{totalVehicles}</p>
                </div>
                <Zap className="h-8 w-8 text-amber-500/30" />
              </div>
              <p className="text-xs text-blue-200/60 mt-1">
                Across multiple transport modes
              </p>
            </div>
          </div>
          
          {/* Transport Mode Summary */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <Truck className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">{truckRoutes} truck routes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <Plane className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium">{airRoutes} air routes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <Ship className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">{seaRoutes} sea routes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">{multiModalCount} multi-modal routes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <ChevronsUpDown className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">{backhaulCount} backhaul opportunities</span>
            </div>
          </div>
          
          {/* Main content */}
          <div className="rounded-xl border border-white/10 bg-[#020617]/80 backdrop-blur-md overflow-hidden">
            <Tabs 
              defaultValue="map" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as any)}
              className="w-full"
            >
              <div className="border-b border-white/10">
                <TabsList className="w-full h-12 bg-transparent">
                  <TabsTrigger 
                    value="map" 
                    className="flex-1 data-[state=active]:bg-white/10 rounded-none border-r border-white/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Interactive Map
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="flex-1 data-[state=active]:bg-white/10 rounded-none border-r border-white/10"
                  >
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Route Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shipments" 
                    className="flex-1 data-[state=active]:bg-white/10 rounded-none"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Shipments
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-0">
                <TabsContent value="map" className="m-0 p-6">
                  <BatchRouteMap 
                    optimizationResult={optimizationResult}
                    onSelectRoute={handleSelectRoute}
                    onBackToUpload={handleBackToUpload}
                  />
                </TabsContent>
                
                <TabsContent value="details" className="m-0 p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-white">Route Details</h2>
                      <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white bg-white/5">
                        <Filter className="h-4 w-4" />
                        Filter Routes
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {optimizationResult.routes.map(route => {
                        // Determine primary transport mode
                        const modeCounts = {
                          truck: route.segments.filter(s => s.mode === "truck").length,
                          plane: route.segments.filter(s => s.mode === "plane").length,
                          ship: route.segments.filter(s => s.mode === "ship").length
                        };
                        
                        let primaryMode = "truck";
                        let primaryIcon = <Truck className="h-5 w-5 text-blue-400" />;
                        
                        if (modeCounts.plane > modeCounts.truck && modeCounts.plane > modeCounts.ship) {
                          primaryMode = "plane";
                          primaryIcon = <Plane className="h-5 w-5 text-purple-400" />;
                        } else if (modeCounts.ship > modeCounts.truck && modeCounts.ship > modeCounts.plane) {
                          primaryMode = "ship";
                          primaryIcon = <Ship className="h-5 w-5 text-green-400" />;
                        }
                        
                        return (
                          <motion.div
                            key={route.id}
                            className={`rounded-lg border ${selectedRouteId === route.id ? 'border-blue-500/50' : 'border-white/10'} bg-white/5 p-4 cursor-pointer`}
                            whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }}
                            onClick={() => handleSelectRoute(route.id)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-900/20">
                                  {primaryIcon}
                                </div>
                                <div>
                                  <h3 className="font-medium text-white">{route.name}</h3>
                                  <p className="text-xs text-blue-200/70">
                                    {route.shipments.length} shipments • {route.segments.length} segments
                                  </p>
                                </div>
                              </div>
                              {route.isMultiModal && (
                                <div className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs font-medium">
                                  Multi-modal
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2 text-xs">
                                <MapPin className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-200/70">From:</span>
                                <span className="font-medium text-white">{route.segments[0].from}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <MapPin className="h-3 w-3 text-red-400" />
                                <span className="text-blue-200/70">To:</span>
                                <span className="font-medium text-white">{route.segments[route.segments.length - 1].to}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="rounded bg-white/10 p-2">
                                <p className="text-xs text-blue-200/50">DISTANCE</p>
                                <p className="font-medium text-sm">{route.totalDistance.toLocaleString()} km</p>
                              </div>
                              <div className="rounded bg-white/10 p-2">
                                <p className="text-xs text-blue-200/50">COST</p>
                                <p className="font-medium text-sm">${route.totalCost.toLocaleString()}</p>
                              </div>
                              <div className="rounded bg-white/10 p-2">
                                <p className="text-xs text-blue-200/50">TIME</p>
                                <p className="font-medium text-sm">{route.totalTime.toFixed(1)} hrs</p>
                              </div>
                            </div>
                            
                            {route.hasBackhaul && route.backhaul && (
                              <div className="mt-3 p-2 rounded bg-green-900/20 border border-green-500/20">
                                <div className="flex items-center gap-2 text-xs">
                                  <Zap className="h-3 w-3 text-green-400" />
                                  <span className="text-green-300">Backhaul opportunity: ${route.backhaul.savings.toLocaleString()} savings</span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="shipments" className="m-0 p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-white">Shipment Details</h2>
                      <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white bg-white/5">
                        <Filter className="h-4 w-4" />
                        Filter Shipments
                      </Button>
                    </div>
                    
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full table-auto">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Origin</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Destination</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Weight (kg)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Dimensions</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Priority</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-200/80">Assigned Route</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {optimizationResult.routes.flatMap(route => 
                            route.shipments.map(shipment => (
                              <tr 
                                key={shipment.id} 
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="px-4 py-2 text-xs text-blue-200/70">{shipment.id}</td>
                                <td className="px-4 py-2 text-xs text-blue-200/70">{shipment.origin}</td>
                                <td className="px-4 py-2 text-xs text-blue-200/70">{shipment.destination}</td>
                                <td className="px-4 py-2 text-xs text-blue-200/70">{shipment.weight}</td>
                                <td className="px-4 py-2 text-xs text-blue-200/70">{shipment.dimensions}                                </td>
                                <td className="px-4 py-2 text-xs">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                    onClick={() => {
                                      const routeWithShipment = optimizationResult.routes.find(r => 
                                        r.shipments.some(s => s.id === shipment.id)
                                      );
                                      if (routeWithShipment) {
                                        setSelectedRouteId(routeWithShipment.id);
                                        setActiveTab("map");
                                      }
                                    }}
                                  >
                                    View Route
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BatchResultsPage;
                                  