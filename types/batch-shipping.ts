/**
 * Type definitions for batch shipping optimization
 */

// Coordinates for mapping and distance calculations
export interface Coordinates {
    lat: number;
    lng: number;
  }
  
  // Transportation modes
  export type TransportMode = 'truck' | 'plane' | 'ship';
  
  // Vehicle types
  export type VehicleType = 'truck' | 'plane' | 'ship';
  
  // Shipment priority
  export type ShipmentPriority = 'low' | 'medium' | 'high';
  
  // Individual shipment data
  export interface Shipment {
    id: string;
    origin: string;
    destination: string;
    weight: number; // Weight in kg
    dimensions: string; // Format: "LxWxH" in cm
    description?: string;
    priority?: ShipmentPriority;
    deadline?: string; // ISO date string
    fragile?: boolean;
    hazardous?: boolean;
    temperature?: {
      min: number;
      max: number;
    };
  }
  
  // Vehicle data
  export interface Vehicle {
    id: string;
    name: string;
    type: VehicleType;
    capacity: number; // Weight capacity in kg
    volumeCapacity: number; // Volume capacity in cubic meters
    baseLocation: string;
    costPerKm: number;
    co2PerKm: number;
    speedKmh: number;
  }
  
  // Cluster of shipments for optimization
  export interface ClusterInfo {
    id: string;
    name: string;
    shipments: Shipment[];
    totalWeight: number;
    totalVolume: number;
    region: string;
    centroid: Coordinates;
  }
  
  // Route segment
  export interface RouteSegment {
    from: string;
    to: string;
    distance: number;
    mode: TransportMode;
    cost: number;
    time: number;
    co2: number;
  }
  
  // Backhaul information
  export interface BackhaulInfo {
    routeId: string;
    savings: number;
    destination: string;
  }
  
  // Process step status
  export type ProcessStepStatus = 'pending' | 'processing' | 'complete' | 'error';
  
  // Optimized route
  export interface OptimizedRoute {
    id: string;
    name: string;
    shipments: Shipment[];
    segments: RouteSegment[];
    vehicles: string[]; // Vehicle IDs
    totalDistance: number;
    totalCost: number;
    totalTime: number;
    totalCO2: number;
    isMultiModal: boolean;
    hasBackhaul?: boolean;
    backhaulRoute?: string;
    backhaul?: BackhaulInfo;
  }
  
  // Overall batch optimization results
  export interface BatchOptimizationResult {
    routes: OptimizedRoute[];
    totalShipments: number;
    totalVehicles: number;
    totalDistance: number;
    totalCost: number;
    totalTime: number;
    totalCO2: number;
    costSavings: number;
    co2Savings: number;
    clusterCount: number;
    multiModalCount: number;
    backhaulCount: number;
    generatedAt: string;
  }
  
  // CSV upload and parsing result
  export interface ShipmentUploadResult {
    shipments: Shipment[];
    validCount: number;
    invalidCount: number;
    errors: { row: number; message: string }[];
    fileName: string;
    fileSize: number;
  }
  
  // Map visualization options
  export interface MapVisualizationOptions {
    showClusters: boolean;
    showVehicles: boolean;
    showMultiModal: boolean;
    showBackhaul: boolean;
    focusOnRoute?: string;
    highlightShipment?: string;
    colorByMode: boolean;
    colorByEfficiency: boolean;
    showSavings: boolean;
  }
  
  // Map route rendering style
  export interface RouteStyle {
    color: string;
    weight: number;
    opacity: number;
    dashArray?: string;
    isSelected?: boolean;
  }
  
  // Optimization status for UI
  export type OptimizationStatus = 
    'idle' | 
    'uploading' | 
    'validating' | 
    'processing' | 
    'optimizing' | 
    'complete' | 
    'error';
  
  // Process steps for UI
  export interface ProcessStep {
    id: string;
    name: string;
    description: string;
    status: ProcessStepStatus;
    percentage: number;
  }