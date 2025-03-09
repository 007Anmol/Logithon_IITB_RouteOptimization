"use client"

import { FC, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import L from "leaflet"
import { 
  Plus, Minus, Layers, MapPin, Package, 
  Truck, Ship, Plane, DollarSign, 
  Zap, Leaf, FileBarChart, Filter, X,
  Eye, EyeOff, ArrowRightCircle, AlertCircle,
  ChevronsUpDown, ArrowRight, ArrowLeft, Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  OptimizedRoute, 
  Shipment, 
  BatchOptimizationResult, 
  MapVisualizationOptions, 
  RouteStyle,
  TransportMode,
  Coordinates,
  RouteSegment
} from "@/types/batch-shipping"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

const LayersControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.LayersControl),
  { ssr: false }
);

import { useMap } from "react-leaflet"

interface BatchRouteMapProps {
  optimizationResult: BatchOptimizationResult;
  onSelectRoute?: (routeId: string) => void;
  onBackToUpload?: () => void;
}

// Helper component to set map view
interface SetMapViewProps {
  bounds?: L.LatLngBoundsExpression;
  center?: Coordinates;
  zoom?: number;
}

const SetMapView: FC<SetMapViewProps> = ({ bounds, center, zoom = 3 }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds as L.LatLngBoundsExpression);
    } else if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [map, bounds, center, zoom]);
  
  return null;
};

// Custom icon for markers
const createCustomIcon = (type: string, color: string) => {
  const getIconHtml = () => {
    switch (type) {
      case 'origin':
        return `<div class="custom-marker origin-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.071 4.929a10 10 0 0 1 0 14.142m-14.142 0a10 10 0 0 1 0-14.142"></path><path d="M21.19 2.81a15 15 0 0 1 0 21.21m-21.21 0a15 15 0 0 1 0-21.21"></path></svg>
                </div>`;
      case 'destination':
        return `<div class="custom-marker destination-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>`;
      case 'hub':
        return `<div class="custom-marker hub-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
                </div>`;
      case 'shipment':
        return `<div class="custom-marker shipment-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="m21 9-9-4-9 4"></path><path d="M12 17v-5"></path><path d="M8 13h8"></path></svg>
                </div>`;
      case 'truck':
        return `<div class="custom-marker vehicle-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M10 17h4V5H2v12h3"></path><path d="M22 17h-8"></path><path d="M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path><path d="M16 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path><path d="M15 5v4h5.59a2 2 0 0 1 1.7 3.07L22 13"></path></svg>
                </div>`;
      case 'plane':
        return `<div class="custom-marker vehicle-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>
                </div>`;
      case 'ship':
        return `<div class="custom-marker vehicle-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><path d="M2 21c.6.5 1.2 1 2.5 1 2.2 0 3.4-1.3 4.5-1.3 1.1 0 2.3 1.3 4.5 1.3s3.4-1.3 4.5-1.3c1.1 0 1.9.8 2.5 1.3"></path><path d="M19 16.7c.5-.2 1-.4 1.6-.7.4 2.3-.5 4.3-2.1 5.4"></path><path d="M2 16c2.4 1.3 5.2 1.1 7-1.7 2.7-.5 5.9-2.9 6-5.8-2.1 0-7.8 1.2-11 5.3V16Z"></path><path d="M11.5 9.5 17 15"></path></svg>
                </div>`;
      default:
        return `<div class="custom-marker" style="background-color: ${color};">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="marker-icon"><circle cx="12" cy="12" r="10"></circle></svg>
                </div>`;
    }
  };

  return L.divIcon({
    className: "custom-div-icon",
    html: getIconHtml(),
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Helper function to get route style
const getRouteStyle = (
  route: OptimizedRoute,
  segment: RouteSegment,
  options: MapVisualizationOptions,
  isSelected: boolean
): RouteStyle => {
  // Base style
  const style: RouteStyle = {
      weight: isSelected ? 5 : 3,
      opacity: isSelected ? 1 : 0.7,
      color: ""
  };

  // Color by mode
  if (options.colorByMode) {
    switch (segment.mode) {
      case "truck":
        style.color = "#3b82f6"; // blue
        break;
      case "plane":
        style.color = "#8b5cf6"; // purple
        break;
      case "ship":
        style.color = "#10b981"; // green
        break;
    }
  } 
  // Color by efficiency
  else if (options.colorByEfficiency) {
    // Calculate efficiency (lower cost per km is better)
    const efficiency = segment.cost / segment.distance;
    if (efficiency < 1) {
      style.color = "#10b981"; // green - very efficient
    } else if (efficiency < 5) {
      style.color = "#f59e0b"; // amber - medium efficiency
    } else {
      style.color = "#ef4444"; // red - less efficient
    }
  } 
  // Default color
  else {
    style.color = "#8b5cf6"; // Default purple
  }

  // Style for multi-modal
  if (route.isMultiModal) {
    style.dashArray = "5, 5";
  }

  // Style for backhaul
  if (route.hasBackhaul) {
    style.dashArray = "1, 5";
  }

  return style;
};

// Get icon and color for transport mode
const getTransportModeInfo = (mode: TransportMode): { icon: React.ReactNode; color: string } => {
  switch (mode) {
    case "truck":
      return { icon: <Truck className="h-4 w-4" />, color: "#3b82f6" };
    case "plane":
      return { icon: <Plane className="h-4 w-4" />, color: "#8b5cf6" };
    case "ship":
      return { icon: <Ship className="h-4 w-4" />, color: "#10b981" };
    default:
      return { icon: <Package className="h-4 w-4" />, color: "#6b7280" };
  }
};

export const BatchRouteMap: FC<BatchRouteMapProps> = ({ 
  optimizationResult, 
  onSelectRoute,
  onBackToUpload
}) => {
  const [mapOptions, setMapOptions] = useState<MapVisualizationOptions>({
    showClusters: true,
    showVehicles: true,
    showMultiModal: true,
    showBackhaul: true,
    colorByMode: true,
    colorByEfficiency: false,
    showSavings: true
  });
  
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 20, lng: 0 });
  const [infoPanel, setInfoPanel] = useState<"routes" | "metrics" | "help">("routes");
  const [mapKey, setMapKey] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Extract all locations for bounds calculation
  useEffect(() => {
    if (optimizationResult && optimizationResult.routes.length > 0) {
      const allPoints: [number, number][] = [];
      
      optimizationResult.routes.forEach(route => {
        route.segments.forEach(segment => {
          // Get coordinates for from and to (would need a helper in real implementation)
          const fromCoords = getLocationCoordinates(segment.from);
          const toCoords = getLocationCoordinates(segment.to);
          
          if (fromCoords) allPoints.push([fromCoords.lat, fromCoords.lng]);
          if (toCoords) allPoints.push([toCoords.lat, toCoords.lng]);
        });
      });
      
      if (allPoints.length > 0) {
        setMapBounds(allPoints as L.LatLngBoundsExpression);
      }
    }
  }, [optimizationResult]);
  
  // Handle route selection
  const handleSelectRoute = (routeId: string) => {
    setSelectedRoute(prev => prev === routeId ? null : routeId);
    
    if (onSelectRoute) {
      onSelectRoute(routeId);
    }
    
    // Focus map on selected route
    if (routeId) {
      const route = optimizationResult.routes.find(r => r.id === routeId);
      if (route) {
        const allPoints: [number, number][] = [];
        
        route.segments.forEach(segment => {
          const fromCoords = getLocationCoordinates(segment.from);
          const toCoords = getLocationCoordinates(segment.to);
          
          if (fromCoords) allPoints.push([fromCoords.lat, fromCoords.lng]);
          if (toCoords) allPoints.push([toCoords.lat, toCoords.lng]);
        });
        
        if (allPoints.length > 0) {
          setMapBounds(allPoints as L.LatLngBoundsExpression);
          setMapKey(prev => prev + 1); // Force map remount to apply bounds
        }
      }
    } else {
      // Reset to show all routes if deselecting
      const allPoints: [number, number][] = [];
      
      optimizationResult.routes.forEach(route => {
        route.segments.forEach(segment => {
          const fromCoords = getLocationCoordinates(segment.from);
          const toCoords = getLocationCoordinates(segment.to);
          
          if (fromCoords) allPoints.push([fromCoords.lat, fromCoords.lng]);
          if (toCoords) allPoints.push([toCoords.lat, toCoords.lng]);
        });
      });
      
      if (allPoints.length > 0) {
        setMapBounds(allPoints as L.LatLngBoundsExpression);
        setMapKey(prev => prev + 1);
      }
    }
  };
  
  // Helper to get location coordinates
  const getLocationCoordinates = (location: string): Coordinates | null => {
    // This would be replaced with a proper lookup in a real implementation
    // For now, we'll use a simple lookup table
    const locationCoords: Record<string, Coordinates> = {
      "Los Angeles, USA": { lat: 34.0522, lng: -118.2437 },
      "New York, USA": { lat: 40.7128, lng: -74.0060 },
      "London, UK": { lat: 51.5074, lng: -0.1278 },
      "Tokyo, Japan": { lat: 35.6762, lng: 139.6503 },
      "Singapore": { lat: 1.3521, lng: 103.8198 },
      "Dubai, UAE": { lat: 25.2048, lng: 55.2708 },
      "Sydney, Australia": { lat: -33.8688, lng: 151.2093 },
      "Mumbai, India": { lat: 19.0760, lng: 72.8777 },
      "Delhi, India": { lat: 28.7041, lng: 77.1025 },
      "Shanghai, China": { lat: 31.2304, lng: 121.4737 },
      "Frankfurt, Germany": { lat: 50.1109, lng: 8.6821 },
      "Hong Kong": { lat: 22.3193, lng: 114.1694 },
      "San Francisco, USA": { lat: 37.7749, lng: -122.4194 },
      "Amsterdam, Netherlands": { lat: 52.3676, lng: 4.9041 },
      "São Paulo, Brazil": { lat: -23.5505, lng: -46.6333 },
      "Mexico City, Mexico": { lat: 19.4326, lng: -99.1332 },
      "Toronto, Canada": { lat: 43.6532, lng: -79.3832 },
      "Cairo, Egypt": { lat: 30.0444, lng: 31.2357 },
      "Moscow, Russia": { lat: 55.7558, lng: 37.6173 },
      "Bangkok, Thailand": { lat: 13.7563, lng: 100.5018 },
      "Jakarta, Indonesia": { lat: -6.2088, lng: 106.8456 },
      "Seoul, South Korea": { lat: 37.5665, lng: 126.9780 },
      "Paris, France": { lat: 48.8566, lng: 2.3522 },
      "Rome, Italy": { lat: 41.9028, lng: 12.4964 },
      "Madrid, Spain": { lat: 40.4168, lng: -3.7038 },
      "Berlin, Germany": { lat: 52.5200, lng: 13.4050 },
      "Vienna, Austria": { lat: 48.2082, lng: 16.3738 },
      "Brussels, Belgium": { lat: 50.8503, lng: 4.3517 },
      "Stockholm, Sweden": { lat: 59.3293, lng: 18.0686 },
      "Warsaw, Poland": { lat: 52.2297, lng: 21.0122 }
    };
    
    // Try exact match
    if (locationCoords[location]) {
      return locationCoords[location];
    }
    
    // Try to find closest match
    const locations = Object.keys(locationCoords);
    for (const loc of locations) {
      if (location.includes(loc) || loc.includes(location)) {
        return locationCoords[loc];
      }
    }
    
    // Extract city name and try to match
    const city = location.split(',')[0].trim();
    for (const loc of locations) {
      if (loc.includes(city)) {
        return locationCoords[loc];
      }
    }
    
    return null;
  };
  
  // Create curved route path between two points
  const createCurvedPath = (
    from: Coordinates, 
    to: Coordinates, 
    height: number = 0.5
  ): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = from.lat * (1-t) + to.lat * t;
      const lng = from.lng * (1-t) + to.lng * t;
      
      // Add some curvature
      const offset = Math.sin(Math.PI * t) * height;
      
      // Determine if we're crossing the international date line
      const lngDiff = to.lng - from.lng;
      const isDateLineCrossing = Math.abs(lngDiff) > 180;
      
      let adjustedLng = lng;
      if (isDateLineCrossing) {
        // Adjust the route to go the other way around the globe
        if (lngDiff > 0) {
          adjustedLng = lng < 0 ? lng + 360 * Math.sin(Math.PI * t) : lng;
        } else {
          adjustedLng = lng > 0 ? lng - 360 * Math.sin(Math.PI * t) : lng;
        }
      }
      
      const curvedLat = lat + offset * (to.lat - from.lat) * 0.5;
      points.push([curvedLat, adjustedLng]);
    }
    
    return points;
  };
  
  if (!optimizationResult || optimizationResult.routes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 p-6 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-yellow-400 mb-4" />
          <h3 className="text-lg font-medium text-white">No optimization data available</h3>
          <p className="text-blue-200/70 mt-2">Please upload a CSV file with shipment data first.</p>
          {onBackToUpload && (
            <Button 
              variant="outline" 
              className="mt-4 border-white/20 hover:bg-white/10"
              onClick={onBackToUpload}
            >
              Back to Upload
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Organize routes by transport modes for filtering
  const routesByMode: Record<TransportMode, OptimizedRoute[]> = {
    truck: [],
    plane: [],
    ship: []
  };
  
  optimizationResult.routes.forEach(route => {
    // Get primary mode (most used in segments)
    const modeCounts: Record<TransportMode, number> = {
      truck: 0,
      plane: 0,
      ship: 0
    };
    
    route.segments.forEach(segment => {
      modeCounts[segment.mode]++;
    });
    
    // Find mode with highest count
    let primaryMode: TransportMode = "truck";
    let maxCount = 0;
    
    Object.entries(modeCounts).forEach(([mode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryMode = mode as TransportMode;
      }
    });
    
    routesByMode[primaryMode].push(route);
  });
  
  // Get selected route object
  const selectedRouteObject = selectedRoute 
    ? optimizationResult.routes.find(r => r.id === selectedRoute)
    : null;
    
  // Get route count by type
  const multiModalCount = optimizationResult.routes.filter(r => r.isMultiModal).length;
  const backhaulCount = optimizationResult.routes.filter(r => r.hasBackhaul).length;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map container */}
      <div className="lg:col-span-2 relative">
        <div className="h-[600px] rounded-xl overflow-hidden border border-white/10 shadow-lg">
          {typeof window !== 'undefined' && (
            <><MapContainer
                          key={mapKey}
                          center={[mapCenter.lat, mapCenter.lng]}
                          zoom={2}
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={false}
                      >
                          <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                          {/* Add map layers for different transport modes */}
                          <LayersControl position="topright">
                              <LayersControl.Overlay checked name="Truck Routes">
                                  <LayersControl.Group>
                                      {optimizationResult.routes.map((route) => {
                                          const isSelected = selectedRoute === route.id

                                          // Skip non-truck routes
                                          if (!route.segments.some(s => s.mode === "truck")) {
                                              return null
                                          }

                                          return route.segments.map((segment, idx) => {
                                              if (segment.mode !== "truck") return null

                                              const fromCoords = getLocationCoordinates(segment.from)
                                              const toCoords = getLocationCoordinates(segment.to)

                                              if (!fromCoords || !toCoords) return null

                                              const curvedPath = createCurvedPath(fromCoords, toCoords, 0.2)
                                              const style = getRouteStyle(route, segment, mapOptions, isSelected)

                                              return (
                                                  <Polyline
                                                      key={$} {...route.id} /> - segment - $); { idx} 
                                          },
                                              positions = { curvedPath },
                                              pathOptions = { style },
                                              eventHandlers = {}, {
                                              click: () => handleSelectRoute(route.id),
                                              mouseover: (e) => {
                                                  e.target.setStyle({ weight: style.weight + 2 })
                                              },
                                              mouseout: (e) => {
                                                  e.target.setStyle({ weight: style.weight })
                                              }
                                          })
                                      },
                                          >
                                          <Tooltip sticky>
                                              <div className="text-xs">
                                                  <strong>{segment.from} → {segment.to}</strong><br />
                                                  Distance: {segment.distance} km<br />
                                                  Mode: {segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}<br />
                                                  Cost: ${segment.cost.toLocaleString()}
                                              </div>
                                          </Tooltip>)}
                                  </Polyline>
                                  );
                                  });
                                  })}
                              </LayersGroup>
                          </LayersControl.Overlay>

                          <LayersControl.Overlay checked name="Air Routes">
                              <LayersGroup>
                                  {optimizationResult.routes.map((route) => {
                                      const isSelected = selectedRoute === route.id

                                      // Skip non-air routes
                                      if (!route.segments.some(s => s.mode === "plane")) {
                                          return null
                                      }

                                      return route.segments.map((segment, idx) => {
                                          if (segment.mode !== "plane") return null

                                          const fromCoords = getLocationCoordinates(segment.from)
                                          const toCoords = getLocationCoordinates(segment.to)

                                          if (!fromCoords || !toCoords) return null

                                          const curvedPath = createCurvedPath(fromCoords, toCoords, 0.5)
                                          const style = getRouteStyle(route, segment, mapOptions, isSelected)

                                          return (
                                              <Polyline
                                                  key={$} {...route.id} /> - segment - $); { idx} 
                                      },
                                          positions = { curvedPath },
                                          pathOptions = { style },
                                          eventHandlers = {}, {
                                          click: () => handleSelectRoute(route.id),
                                          mouseover: (e) => {
                                              e.target.setStyle({ weight: style.weight + 2 })
                                          },
                                          mouseout: (e) => {
                                              e.target.setStyle({ weight: style.weight })
                                          }
                                      })
                                  },
                                      >
                                      <Tooltip sticky>
                                          <div className="text-xs">
                                              <strong>{segment.from} → {segment.to}</strong><br />
                                              Distance: {segment.distance} km<br />
                                              Mode: {segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}<br />
                                              Cost: ${segment.cost.toLocaleString()}
                                          </div>
                                      </Tooltip>)}
                              </Polyline>
                              );
                              });
                              })}
                          </LayersGroup>
                      </LayersControl.Overlay><LayersControl.Overlay checked name="Sea Routes">
                              <LayersGroup>
                                  {optimizationResult.routes.map((route) => {
                                      const isSelected = selectedRoute === route.id

                                      // Skip non-sea routes
                                      if (!route.segments.some(s => s.mode === "ship")) {
                                          return null
                                      }

                                      return route.segments.map((segment, idx) => {
                                          if (segment.mode !== "ship") return null

                                          const fromCoords = getLocationCoordinates(segment.from)
                                          const toCoords = getLocationCoordinates(segment.to)

                                          if (!fromCoords || !toCoords) return null

                                          const curvedPath = createCurvedPath(fromCoords, toCoords, -0.3)
                                          const style = getRouteStyle(route, segment, mapOptions, isSelected)

                                          return (
                                              <Polyline
                                                  key={$} {...route.id} /> - segment - $); { idx} 
                                      },
                                          positions = { curvedPath },
                                          pathOptions = { style },
                                          eventHandlers = {}, {
                                          click: () => handleSelectRoute(route.id),
                                          mouseover: (e) => {
                                              e.target.setStyle({ weight: style.weight + 2 })
                                          },
                                          mouseout: (e) => {
                                              e.target.setStyle({ weight: style.weight })
                                          }
                                      })
                                  },
                                      >
                                      <Tooltip sticky>
                                          <div className="text-xs">
                                              <strong>{segment.from} → {segment.to}</strong><br />
                                              Distance: {segment.distance} km<br />
                                              Mode: {segment.mode.charAt(0).toUpperCase() + segment.mode.slice(1)}<br />
                                              Cost: ${segment.cost.toLocaleString()}
                                          </div>
                                      </Tooltip>)}
                              </Polyline>
                              );
                              });
                              })}
                          </LayersGroup></>
                </LayersControl.Overlay>
                
                <LayersControl.Overlay checked name="Locations">
                  <LayersGroup>
                    {/* Get all unique locations from routes */}
                    {(() => {
                      const locations: Record<string, { 
                        type: "origin" | "destination" | "hub",
                        count: number
                      }> = {};
                      
                      optimizationResult.routes.forEach(route => {
                        route.segments.forEach((segment, idx) => {
                          // First segment from is origin
                          if (idx === 0) {
                            if (!locations[segment.from]) {
                              locations[segment.from] = { type: "origin", count: 1 };
                            } else {
                              locations[segment.from].count++;
                              // Keep as origin if already marked as such
                              if (locations[segment.from].type !== "origin") {
                                locations[segment.from].type = "hub";
                              }
                            }
                          } else {
                            // Middle segments are hubs
                            if (!locations[segment.from]) {
                              locations[segment.from] = { type: "hub", count: 1 };
                            } else {
                              locations[segment.from].count++;
                            }
                          }
                          
                          // Last segment to is destination
                          if (idx === route.segments.length - 1) {
                            if (!locations[segment.to]) {
                              locations[segment.to] = { type: "destination", count: 1 };
                            } else {
                              locations[segment.to].count++;
                              // Keep as destination if already marked as such
                              if (locations[segment.to].type !== "destination") {
                                locations[segment.to].type = "hub";
                              }
                            }
                          } else {
                            // Middle segments are hubs
                            if (!locations[segment.to]) {
                              locations[segment.to] = { type: "hub", count: 1 };
                            } else {
                              locations[segment.to].count++;
                            }
                          }
                        });
                      });
                      
                      return Object.entries(locations).map(([location, info]) => {
                        const coords = getLocationCoordinates(location);
                        if (!coords) return null;
                        
                        // Get color based on type
                        let color: string;
                        switch (info.type) {
                          case "origin":
                            color = "#3b82f6"; // blue
                            break;
                          case "destination":
                            color = "#ef4444"; // red
                            break;
                          case "hub":
                            color = "#f59e0b"; // amber
                            break;
                        }
                        
                        const icon = createCustomIcon(info.type, color);
                        
                        return (
                          <Marker 
                            key={location-${location}}
                            position={[coords.lat, coords.lng]} 
                            icon={icon}
                          >
                            <Popup>
                              <div className="text-xs">
                                <strong>{location}</strong><br />
                                Type: {info.type.charAt(0).toUpperCase() + info.type.slice(1)}<br />
                                Routes: {info.count}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      });
                    })()}
                  </LayersGroup>
                </LayersControl.Overlay>
              </LayersControl>
              
              {/* Set view based on bounds or center */}
              {mapBounds ? (
                <SetMapView bounds={mapBounds} />
              ) : (
                <SetMapView center={mapCenter} />
              )}
              
              {/* Map controls */}
              <div className="absolute top-2 left-2 z-overlay">
                <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                  <div className="p-1 flex flex-col space-y-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setShowFilters(!showFilters)}
                      title="Toggle map filters"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setMapBounds(mapBounds)}
                      title="Reset view"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Zoom controls */}
              <div className="absolute bottom-4 left-2 z-overlay">
                <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                  <div className="p-1 flex flex-col space-y-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => {
                        const map = document.querySelector('.leaflet-container')
                          ._leaflet_map;
                        map.zoomIn();
                      }}
                      title="Zoom in"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => {
                        const map = document.querySelector('.leaflet-container')
                          ._leaflet_map;
                        map.zoomOut();
                      }}
                      title="Zoom out"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </MapContainer>
          )}
          
          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-12 left-2 z-overlay w-64"
              >
                <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 shadow-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-white">Map Display Options</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-blue-200/80">Color by mode</label>
                        <Switch
                          checked={mapOptions.colorByMode}
                          onCheckedChange={(checked) => {
                            setMapOptions(prev => ({
                              ...prev,
                              colorByMode: checked,
                              colorByEfficiency: checked ? false : prev.colorByEfficiency
                            }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-blue-200/80">Color by efficiency</label>
                        <Switch
                          checked={mapOptions.colorByEfficiency}
                          onCheckedChange={(checked) => {
                            setMapOptions(prev => ({
                              ...prev,
                              colorByEfficiency: checked,
                              colorByMode: checked ? false : prev.colorByMode
                            }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-blue-200/80">Show clusters</label>
                        <Switch
                          checked={mapOptions.showClusters}
                          onCheckedChange={(checked) => {
                            setMapOptions(prev => ({
                              ...prev,
                              showClusters: checked
                            }));
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-blue-200/80">Show vehicles</label>
                        <Switch
                          checked={mapOptions.showVehicles}
                          onCheckedChange={(checked) => {
                            setMapOptions(prev => ({
                              ...prev,
                              showVehicles: checked
                            }));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-white/10">
                      <h4 className="text-xs font-medium text-white mb-2">Route Types</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-blue-200/80">Truck routes</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                          <span className="text-xs text-blue-200/80">Air routes</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-blue-200/80">Sea routes</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 border-2 border-white rounded-full"></div>
                          <span className="text-xs text-blue-200/80">Multi-modal routes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Legend and quick stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <><div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between">
                    <div>
                        <p className="text-xs text-blue-200/50">TOTAL ROUTES</p>
                        <p className="text-xl font-bold">{optimizationResult.routes.length}</p>
                    </div>
                    <FileBarChart className="h-8 w-8 text-blue-400/30" />
                </div>
            </div><div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-blue-200/50">TOTAL SHIPMENTS</p>
                            <p className="text-xl font-bold">{optimizationResult.totalShipments}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-400/30" />
                    </div>
                </div><div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-blue-200/50">DISTANCE COVERED</p>
                            <p className="text-xl font-bold">{(optimizationResult.totalDistance / 1000).toFixed(1)}K km</p>
                        </div>
                        <MapPin className="h-8 w-8 text-blue-400/30" />
                    </div>
                </div><div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-blue-200/50">COST SAVINGS</p>
                            <p className="text-xl font-bold">${optimizationResult.costSavings.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-400/30" />
                    </div>
                </div></>
        </div>
      </div>
      
      {/* Side panel */}
      <div className="rounded-xl border border-white/10 bg-[#020617]/80 backdrop-blur-md shadow-lg overflow-hidden">
        <Tabs defaultValue="routes" className="w-full" onValueChange={(value) => setInfoPanel(value as any)}>
          <div className="border-b border-white/10">
            <TabsList className="w-full h-12 bg-transparent">
              <TabsTrigger 
                value="routes" 
                className="flex-1 data-[state=active]:bg-white/10 rounded-none border-r border-white/10"
              >
                Routes
              </TabsTrigger>
              <TabsTrigger 
                value="metrics" 
                className="flex-1 data-[state=active]:bg-white/10 rounded-none border-r border-white/10"
              >
                Metrics
              </TabsTrigger>
              <TabsTrigger 
                value="help" 
                className="flex-1 data-[state=active]:bg-white/10 rounded-none"
              >
                Help
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-0">
            {/* Routes panel */}
            <TabsContent value="routes" className="m-0">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h3 className="text-lg font-medium">Optimized Routes</h3>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-300/30">
                  {optimizationResult.routes.length} routes
                </Badge>
              </div>
              
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-4">
                  {optimizationResult.routes.map((route) => {
                    const isSelected = selectedRoute === route.id;
                    
                    // Get primary transport mode
                    const modeCounts: Record<TransportMode, number> = {
                      truck: 0,
                      plane: 0,
                      ship: 0
                    };
                    
                    route.segments.forEach(segment => {
                      modeCounts[segment.mode]++;
                    });
                    
                    let primaryMode: TransportMode = "truck";
                    let maxCount = 0;
                    
                    Object.entries(modeCounts).forEach(([mode, count]) => {
                      if (count > maxCount) {
                        maxCount = count;
                        primaryMode = mode as TransportMode;
                      }
                    });
                    
                    // Get mode info
                    const modeInfo = getTransportModeInfo(primaryMode);
                    
                    return (
                      <motion.div
                        key={route.id}
                        className={rounded-xl border ${isSelected ? 'border-blue-500/50' : 'border-white/10'} overflow-hidden cursor-pointer}
                        whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }}
                        onClick={() => handleSelectRoute(route.id)}
                      >
                        <div className={p-3 ${isSelected ? 'bg-blue-900/20' : 'bg-white/5'}}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div 
                                className="rounded-full h-10 w-10 flex items-center justify-center" 
                                style={{ backgroundColor: ${modeInfo.color}20 }}
                              >
                                {modeInfo.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-sm text-white truncate max-w-[120px]">
                                    {route.name}
                                  </h3>
                                  {route.isMultiModal && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30 text-[10px] px-1">
                                      Multi-modal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-blue-200/60">
                                  {route.shipments.length} shipments • {route.segments.length} segments
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-blue-200/50">COST</p>
                              <p className="font-medium text-sm">${route.totalCost.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="p-4 border-t border-white/10 bg-blue-950/20">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-blue-200/50">DISTANCE</p>
                                <p className="font-medium">{route.totalDistance.toLocaleString()} km</p>
                              </div>
                              <div>
                                <p className="text-xs text-blue-200/50">TIME</p>
                                <p className="font-medium">{route.totalTime.toFixed(1)} h</p>
                              </div>
                              <div>
                                <p className="text-xs text-blue-200/50">CO₂</p>
                                <p className="font-medium">{route.totalCO2.toLocaleString()} kg</p>
                              </div>
                            </div>
                            
                            <h4 className="text-xs font-medium text-white mb-2">Route Segments</h4>
                            <div className="space-y-3 mb-4">
                              {route.segments.map((segment, idx) => {
                                const { icon, color } = getTransportModeInfo(segment.mode);
                                return (
                                  <><div key={idx} className="flex items-start gap-3 text-xs p-2 rounded-lg bg-white/5">
                                        <div
                                            className="mt-0.5 rounded-full h-4 w-4 flex-shrink-0 flex items-center justify-center"
                                            style={{ backgroundColor: $ }} {...color} />30 }}
                                        >
                                        {icon}
                                    </div><div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {segment.from} → {segment.to}
                                            </p>
                                            <p className="text-blue-200/60 text-xs">
                                                {segment.distance.toLocaleString()} km • {segment.time.toFixed(1)} h • ${segment.cost.toLocaleString()}
                                            </p>
                                        </div></>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {route.hasBackhaul && route.backhaul && (
                              <div className="mb-4 p-2 rounded-lg bg-green-900/20 border border-green-500/20">
                                <div className="flex items-start gap-2">
                                  <Zap className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-green-300">Backhaul Opportunity</p>
                                    <p className="text-xs text-green-200/70">
                                      Save ${route.backhaul.savings.toLocaleString()} by using return capacity to {route.backhaul.destination}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              size="sm"
                            >
                              <Check className="h-3 w-3 mr-1" /> Confirm Route Plan
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Metrics panel */}
            <TabsContent value="metrics" className="m-0">
              <><div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h3 className="text-lg font-medium">Optimization Metrics</h3>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-300/30">
                        Summary
                    </Badge>
                </div><ScrollArea className="h-[500px]">
                        <div className="p-4 space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-transparent border-white/10">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-400" />
                                            <span>Cost Savings</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-2xl font-bold">${optimizationResult.costSavings.toLocaleString()}</p>
                                        <p className="text-xs text-blue-200/60">Compared to individual shipping</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-transparent border-white/10">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Leaf className="h-4 w-4 text-green-400" />
                                            <span>CO₂ Reduction</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-2xl font-bold">{optimizationResult.co2Savings.toLocaleString()} kg</p>
                                        <p className="text-xs text-blue-200/60">Environmental impact reduction</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Route type metrics */}
                            <div>
                                <h4 className="text-sm font-medium mb-3">Route Metrics</h4>

                                <div className="space-y-4">
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <ArrowRightCircle className="h-4 w-4 text-purple-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Multi-modal Routes</p>
                                                    <p className="text-xs text-blue-200/60">Combined transport methods</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold">{multiModalCount}</p>
                                                <p className="text-xs text-blue-200/60">
                                                    {((multiModalCount / optimizationResult.routes.length) * 100).toFixed(0)}% of total
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <ArrowRightCircle className="h-4 w-4 text-green-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Backhaul Optimization</p>
                                                    <p className="text-xs text-blue-200/60">Return capacity utilization</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold">{backhaulCount}</p>
                                                <p className="text-xs text-blue-200/60">
                                                    {((backhaulCount / optimizationResult.routes.length) * 100).toFixed(0)}% of total
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <ArrowRightCircle className="h-4 w-4 text-blue-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Geographic Clusters</p>
                                                    <p className="text-xs text-blue-200/60">Grouped by destination proximity</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold">{optimizationResult.clusterCount}</p>
                                                <p className="text-xs text-blue-200/60">
                                                    Avg. {(optimizationResult.totalShipments / optimizationResult.clusterCount).toFixed(1)} shipments per cluster
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transport mode breakdown */}
                            <div>
                                <h4 className="text-sm font-medium mb-3">Transport Mode Breakdown</h4>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-blue-200/80 flex items-center gap-1">
                                                <Truck className="h-3 w-3" /> Truck Routes
                                            </span>
                                            <span>{routesByMode.truck.length} routes</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{
                                                    width: $
                                                }} {...(routesByMode.truck.length / optimizationResult.routes.length) * 100} />%
                                            }}
                                            ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-blue-200/80 flex items-center gap-1">
                                            <Plane className="h-3 w-3" /> Air Routes
                                        </span>
                                        <span>{routesByMode.plane.length} routes</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{
                                                width: $
                                            }} {...(routesByMode.plane.length / optimizationResult.routes.length) * 100} />%
                                        }}
                                        ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-blue-200/80 flex items-center gap-1">
                                        <Ship className="h-3 w-3" /> Sea Routes
                                    </span>
                                    <span>{routesByMode.ship.length} routes</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{
                                            width: $
                                        }} {...(routesByMode.ship.length / optimizationResult.routes.length) * 100} />%
                                    }}
                                    ></div>
                            </div>
                        </div>
                    </div></>
                  </div>
                  
                  {/* Cost breakdown */}
                  <div>
                    <><h4 className="text-sm font-medium mb-2">Cost Breakdown</h4><div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-blue-200/80">Total Transport Cost</span>
                              <span className="text-xs font-medium">${optimizationResult.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-blue-200/80">Average Cost per Route</span>
                              <span className="text-xs font-medium">
                                  ${(optimizationResult.totalCost / optimizationResult.routes.length).toLocaleString()}
                              </span>
                          </div>
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-blue-200/80">Average Cost per Shipment</span>
                              <span className="text-xs font-medium">
                                  ${(optimizationResult.totalCost / optimizationResult.totalShipments).toLocaleString()}
                              </span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-xs text-blue-200/80">Cost per km</span>
                              <span className="text-xs font-medium">
                                  ${(optimizationResult.totalCost / optimizationResult.totalDistance).toFixed(2)}
                              </span>
                          </div>
                      </div></>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10 text-xs text-blue-200/60 flex justify-between">
                    <span>Generated: {new Date(optimizationResult.generatedAt).toLocaleString()}</span>
                    <span>
                      <a href="#" className="text-blue-400 hover:underline">Export report</a>
                    </span>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Help panel */}
            <TabsContent value="help" className="m-0">
              <><div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h3 className="text-lg font-medium">Help & Information</h3>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-300/30">
                        Guide
                    </Badge>
                </div><ScrollArea className="h-[500px]">
                        <div className="p-4 space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Route Optimization</h4>
                                <p className="text-xs text-blue-200/80 leading-relaxed">
                                    Our advanced algorithm optimizes shipment routing by clustering deliveries,
                                    selecting the most efficient transport modes, and ensuring vehicles don't return empty.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Map Legend</h4>

                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                    <h5 className="text-xs font-medium mb-2">Route Types</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-6 bg-blue-500 rounded-full"></div>
                                            <span className="text-xs text-blue-200/80">Truck routes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-6 bg-purple-500 rounded-full"></div>
                                            <span className="text-xs text-blue-200/80">Air routes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-6 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-blue-200/80">Sea routes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-6 bg-purple-500 rounded-full"
                                                style={{ backgroundImage: 'repeating-linear-gradient(to right, #8b5cf6, #8b5cf6 5px, transparent 5px, transparent 10px)' }}></div>
                                            <span className="text-xs text-blue-200/80">Multi-modal routes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 roun" /></></></></>