"use client"

import { useState, useEffect, FC, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import L from "leaflet"
import { 
  Clock, Coins, Leaf, ArrowRightLeft, Check, 
  ChevronDown, ChevronUp, Calendar, Ship, Plane, 
  Truck, AlertTriangle, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types for the route data and form inputs
export interface FormData {
  senderName: string;
  category: string;
  weight: string;
  quantity: string;
  pickup: string;
  delivery: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteSegment {
  mode: 'air' | 'sea' | 'land';
  origin: string;
  destination: string;
  distance_km: number;
  transit_time_hours: number;
  cost_usd: number;
  co2_emissions_kg: number;
}

export interface Route {
  route_name: string;
  route_type: 'fastest' | 'cheapest' | 'multimodal' | 'sustainable';
  color: string;
  mode_icon: ReactNode;
  path: [number, number][];
  segments: RouteSegment[];
  total_distance_km: number;
  total_transit_time_hours: number;
  total_cost_usd: number;
  total_co2_emissions_kg: number;
  perishability_suitability: 'High' | 'Medium' | 'Low';
  risk_level: 'High' | 'Medium' | 'Low';
  reliability: 'High' | 'Medium' | 'Low';
}

interface RouteData {
  routes: Route[];
  source: string;
  destination: string;
  sourceCoords: Coordinates;
  destCoords: Coordinates;
  cargo: {
    weight_kg: number;
    category: string;
  };
}

interface RouteMapProps {
  formData: FormData;
  onSelectRoute: (route: Route) => void;
  onGoBack: () => void;
}

interface SetMapViewProps {
  coords: Coordinates;
}

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

import { useMap } from 'react-leaflet';

// Fix for Leaflet marker icons in Next.js
const mapIcon = (color = "blue") => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// Function to generate route data based on form inputs
const generateRouteData = (formData: FormData): RouteData => {
  // Locations with coordinates
  const locations: Record<string, Coordinates> = {
    "Los Angeles, USA": { lat: 34.0522, lng: -118.2437 },
    "New York, USA": { lat: 40.7128, lng: -74.0060 },
    "London, UK": { lat: 51.5074, lng: -0.1278 },
    "Tokyo, Japan": { lat: 35.6762, lng: 139.6503 },
    "Singapore": { lat: 1.3521, lng: 103.8198 },
    "Dubai, UAE": { lat: 25.2048, lng: 55.2708 },
    "Sydney, Australia": { lat: -33.8688, lng: 151.2093 },
    "Mumbai, India": { lat: 19.0760, lng: 72.8777 },
    "Shanghai, China": { lat: 31.2304, lng: 121.4737 }
  };
  
  // Try to get coordinates for the locations, or use defaults
  const sourceCoords = locations[formData.pickup] || locations["Los Angeles, USA"];
  const destCoords = locations[formData.delivery] || locations["London, UK"];
  
  // Calculate distance
  const distanceKm = calculateDistance(sourceCoords.lat, sourceCoords.lng, destCoords.lat, destCoords.lng);
  
  // Create intermediate points for curved routes
  const createCurvedRoute = (source: Coordinates, destination: Coordinates, height = 0.5, points = 50): [number, number][] => {
    const result: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      // Create a slight arc
      const lat = source.lat * (1-t) + destination.lat * t;
      const lng = source.lng * (1-t) + destination.lng * t;
      // Add some curvature
      const offset = Math.sin(Math.PI * t) * height;
      
      // Determine if we're crossing the international date line
      const lngDiff = destination.lng - source.lng;
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
      
      const curvedLat = lat + offset * (destination.lat - source.lat) * 0.5;
      result.push([curvedLat, adjustedLng]);
    }
    return result;
  };
  
  // Generate air route
  const airRoute: Route = {
    route_name: "Air Transport",
    route_type: "fastest",
    color: "#3b82f6", // blue
    mode_icon: <Plane className="h-5 w-5 text-blue-400" />,
    path: createCurvedRoute(sourceCoords, destCoords, 0.5),
    segments: [
      {
        mode: "air",
        origin: formData.pickup,
        destination: formData.delivery,
        distance_km: distanceKm,
        transit_time_hours: Math.round(distanceKm / 800 * 10) / 10,
        cost_usd: Math.round(distanceKm * 3.5),
        co2_emissions_kg: Math.round(distanceKm * 0.25)
      }
    ],
    total_distance_km: distanceKm,
    total_transit_time_hours: Math.round(distanceKm / 800 * 10) / 10,
    total_cost_usd: Math.round(distanceKm * 3.5),
    total_co2_emissions_kg: Math.round(distanceKm * 0.25),
    perishability_suitability: "High",
    risk_level: "Medium",
    reliability: "High"
  };
  
  // Generate sea route
  const seaRoute: Route = {
    route_name: "Sea Transport",
    route_type: "cheapest",
    color: "#10b981", // green
    mode_icon: <Ship className="h-5 w-5 text-emerald-400" />,
    path: createCurvedRoute(sourceCoords, destCoords, -0.5),
    segments: [
      {
        mode: "sea",
        origin: formData.pickup,
        destination: formData.delivery,
        distance_km: distanceKm,
        transit_time_hours: Math.round(distanceKm / 25 * 10) / 10,
        cost_usd: Math.round(distanceKm * 0.4),
        co2_emissions_kg: Math.round(distanceKm * 0.04)
      }
    ],
    total_distance_km: distanceKm,
    total_transit_time_hours: Math.round(distanceKm / 25 * 10) / 10,
    total_cost_usd: Math.round(distanceKm * 0.4),
    total_co2_emissions_kg: Math.round(distanceKm * 0.04),
    perishability_suitability: "Low",
    risk_level: "Medium",
    reliability: "Medium"
  };
  
// Function to calculate an appropriate intermediate point based on source and destination
function calculateIntermediatePoint(source: Coordinates, dest: Coordinates): Coordinates {
  // Calculate a point roughly halfway between source and destination
  // with a slight offset to create a realistic transfer location
  const midLat = (source.lat + dest.lat) / 2;
  const midLng = (source.lng + dest.lng) / 2;
  
  // Add a small random offset (within 5-10% of the distance)
  // to make the route more realistic and avoid a straight line
  const latOffset = (dest.lat - source.lat) * (0.05 + Math.random() * 0.05);
  const lngOffset = (dest.lng - source.lng) * (0.05 + Math.random() * 0.05);
  
  return {
    lat: midLat + latOffset,
    lng: midLng + lngOffset
  };
}

// Find a suitable name for the intermediate point
function getIntermediateLocationName(point: Coordinates): string {
  return "Transit Hub";
}

// Get city names for creating hub names
const sourceCity = formData.pickup.split(',')[0].trim();
const destCity = formData.delivery.split(',')[0].trim();

// Source and destination local hubs
const sourceCityHub = `${sourceCity} Transport Hub`;
const destCityHub = `${destCity} Transport Hub`;

// Calculate intermediate point for the main transport segment
const intermediatePoint = calculateIntermediatePoint(sourceCoords, destCoords);
const intermediateLocationName = getIntermediateLocationName(intermediatePoint);

// Calculate distances for all segments
// Local road distance at source (estimate 15km)
const localSourceDist = 15;
// Main transport distance
const mainDist = calculateDistance(sourceCoords.lat, sourceCoords.lng, destCoords.lat, destCoords.lng);
// Local road distance at destination (estimate 15km)
const localDestDist = 15;

// Create the multimodal route with three segments
const multimodalRoute: Route = {
  route_name: "Multimodal Transport",
  route_type: "multimodal",
  color: "#8b5cf6", // purple
  mode_icon: <ArrowRightLeft className="h-5 w-5 text-purple-400" />,
  path: [
    ...createCurvedRoute(sourceCoords, intermediatePoint, 0.3),
    ...createCurvedRoute(intermediatePoint, destCoords, 0.3)
  ],
  segments: [
    {
      mode: "road",
      origin: formData.pickup,
      destination: sourceCityHub,
      distance_km: localSourceDist,
      transit_time_hours: Math.round(localSourceDist / 40 * 10) / 10, // 40km/h average speed
      cost_usd: Math.round(localSourceDist * 2), // $2 per km for road
      co2_emissions_kg: Math.round(localSourceDist * 0.15) // 0.15kg CO2 per km for road
    },
    {
      mode: "air",
      origin: sourceCityHub,
      destination: intermediateLocationName,
      distance_km: Math.round(mainDist / 2),
      transit_time_hours: Math.round((mainDist / 2) / 800 * 10) / 10, // 800km/h for air
      cost_usd: Math.round((mainDist / 2) * 3), // $3 per km for air
      co2_emissions_kg: Math.round((mainDist / 2) * 0.2) // 0.2kg CO2 per km for air
    },
    {
      mode: "sea",
      origin: intermediateLocationName,
      destination: destCityHub,
      distance_km: Math.round(mainDist / 2),
      transit_time_hours: Math.round((mainDist / 2) / 30 * 10) / 10, // 30km/h for sea
      cost_usd: Math.round((mainDist / 2) * 0.5), // $0.5 per km for sea
      co2_emissions_kg: Math.round((mainDist / 2) * 0.05) // 0.05kg CO2 per km for sea
    },
    {
      mode: "road",
      origin: destCityHub,
      destination: formData.delivery,
      distance_km: localDestDist,
      transit_time_hours: Math.round(localDestDist / 40 * 10) / 10, // 40km/h average speed
      cost_usd: Math.round(localDestDist * 2), // $2 per km for road
      co2_emissions_kg: Math.round(localDestDist * 0.15) // 0.15kg CO2 per km for road
    }
  ],
  total_distance_km: localSourceDist + mainDist + localDestDist,
  total_transit_time_hours: 
    Math.round(localSourceDist / 40 * 10) / 10 + 
    Math.round((mainDist / 2) / 800 * 10) / 10 + 
    Math.round((mainDist / 2) / 30 * 10) / 10 + 
    Math.round(localDestDist / 40 * 10) / 10,
  total_cost_usd: 
    Math.round(localSourceDist * 2) + 
    Math.round((mainDist / 2) * 3) + 
    Math.round((mainDist / 2) * 0.5) + 
    Math.round(localDestDist * 2),
  total_co2_emissions_kg: 
    Math.round(localSourceDist * 0.15) + 
    Math.round((mainDist / 2) * 0.2) + 
    Math.round((mainDist / 2) * 0.05) + 
    Math.round(localDestDist * 0.15),
  perishability_suitability: "Medium",
  risk_level: "Medium",
  reliability: "High"
};
  
  // Generate sustainable route
  const sustainableRoute: Route = {
    route_name: "Sustainable Transport",
    route_type: "sustainable",
    color: "#34d399", // teal
    mode_icon: <Leaf className="h-5 w-5 text-emerald-400" />,
    path: createCurvedRoute(sourceCoords, destCoords, 0.2),
    segments: [
      {
        mode: "sea",
        origin: formData.pickup,
        destination: formData.delivery,
        distance_km: distanceKm,
        transit_time_hours: Math.round(distanceKm / 20 * 10) / 10,
        cost_usd: Math.round(distanceKm * 0.45),
        co2_emissions_kg: Math.round(distanceKm * 0.02)
      }
    ],
    total_distance_km: distanceKm,
    total_transit_time_hours: Math.round(distanceKm / 20 * 10) / 10,
    total_cost_usd: Math.round(distanceKm * 0.45),
    total_co2_emissions_kg: Math.round(distanceKm * 0.02),
    perishability_suitability: "Low",
    risk_level: "Low",
    reliability: "Medium"
  };
  
  return {
    routes: [airRoute, seaRoute, multimodalRoute, sustainableRoute],
    source: formData.pickup,
    destination: formData.delivery,
    sourceCoords,
    destCoords,
    cargo: {
      weight_kg: parseInt(formData.weight) || 5,
      category: formData.category
    }
  };
};

// Distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d);
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Component to recenter map view
function SetMapView({ coords }: SetMapViewProps): null {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView([coords.lat, coords.lng], 3);
    }
  }, [coords, map]);
  return null;
}

// Map section component to reduce duplication
interface MapSectionProps {
  compact?: boolean;
  routeData: RouteData;
  mapCenter: Coordinates;
  activeRouteIds: string[];
  selectedRoute: Route | null;
  handleRouteClick: (route: Route) => void;
  toggleRouteVisibility: (routeId: string) => void;
}

const MapSection: FC<MapSectionProps> = ({ 
  compact = false, 
  routeData, 
  mapCenter, 
  activeRouteIds, 
  selectedRoute,
  handleRouteClick,
  toggleRouteVisibility
}) => {
  // Function to get label for route types
  const getRouteLabel = (routeType: string): { icon: ReactNode; label: string } => {
    switch(routeType) {
      case 'fastest': return { icon: <Clock className="h-4 w-4" />, label: 'Fastest' };
      case 'cheapest': return { icon: <Coins className="h-4 w-4" />, label: 'Cheapest' };
      case 'multimodal': return { icon: <ArrowRightLeft className="h-4 w-4" />, label: 'Multimodal' };
      case 'sustainable': return { icon: <Leaf className="h-4 w-4" />, label: 'Sustainable' };
      default: return { icon: null, label: routeType };
    }
  };

  // Ensure leaflet is only loaded client-side
  if (typeof window === 'undefined') {
    return <div className={`relative ${compact ? 'h-56' : 'h-80'} rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4 bg-slate-900`}></div>;
  }

  return (
    <div className={`relative ${compact ? 'h-56' : 'h-80'} rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4`}>
      <MapContainer 
        center={[mapCenter.lat, mapCenter.lng]} 
        zoom={3} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={!compact}
        attributionControl={!compact}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Source and destination markers */}
        <Marker 
          position={[routeData.sourceCoords.lat, routeData.sourceCoords.lng]} 
          icon={mapIcon('#3b82f6')}
        >
          <Popup>Source: {routeData.source}</Popup>
        </Marker>
        <Marker 
          position={[routeData.destCoords.lat, routeData.destCoords.lng]} 
          icon={mapIcon('#ef4444')}
        >
          <Popup>Destination: {routeData.destination}</Popup>
        </Marker>
        
        {/* Route lines */}
        {routeData.routes.map((route) => {
          const isActive = activeRouteIds.includes(route.route_type);
          const isSelected = selectedRoute && selectedRoute.route_type === route.route_type;
          const lineWeight = isSelected ? 6 : 4;
          const lineOpacity = isSelected ? 1 : isActive ? 0.8 : 0.2;
          
          return isActive || !compact ? (
            <Polyline 
              key={route.route_type}
              positions={route.path}
              pathOptions={{ 
                color: route.color, 
                weight: lineWeight, 
                opacity: lineOpacity,
                dashArray: route.route_type === 'multimodal' ? '5, 5' : undefined
              }}
              eventHandlers={{
                click: () => handleRouteClick(route),
                mouseover: (e) => {
                  if (!compact) e.target.setStyle({ weight: lineWeight + 1 });
                },
                mouseout: (e) => {
                  if (!compact) e.target.setStyle({ weight: lineWeight });
                }
              }}
            />
          ) : null;
        })}

        {/* Dynamic view update */}
        <SetMapView coords={mapCenter} />
      </MapContainer>
      
      {!compact && (
        <div className="absolute top-3 right-3 z-overlay bg-black/30 backdrop-blur-md p-2 rounded-lg border border-white/10">
          <div className="flex flex-col space-y-2">
            {routeData.routes.map(route => {
              const { icon, label } = getRouteLabel(route.route_type);
              const isActive = activeRouteIds.includes(route.route_type);
              
              return (
                <div 
                  key={route.route_type}
                  className={`flex items-center cursor-pointer px-2 py-1 rounded ${isActive ? 'bg-white/10' : 'bg-black/30'}`}
                  onClick={() => toggleRouteVisibility(route.route_type)}
                >
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: route.color }}></div>
                  <div className="flex items-center gap-1">
                    {icon}
                    <span className="text-xs font-medium text-white/80">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const RouteMap: FC<RouteMapProps> = ({ formData, onSelectRoute, onGoBack }) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [activeRouteIds, setActiveRouteIds] = useState<string[]>([]);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "map" | "confirmation">("loading");
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 34.0522, lng: -118.2437 });
  const [mapKey, setMapKey] = useState<number>(0); // Used to force remount the map

  // Simulate API call for route data
  useEffect(() => {
    if (formData) {
      const timer = setTimeout(() => {
        const data = generateRouteData(formData);
        setRouteData(data);
        setMapCenter({
          lat: (data.sourceCoords.lat + data.destCoords.lat) / 2,
          lng: (data.sourceCoords.lng + data.destCoords.lng) / 2
        });
        setLoading(false);
        setStep("map");
        
        // Initially show all routes
        setActiveRouteIds(data.routes.map(route => route.route_type));
      }, 2000); // Simulate 2 second loading time
      return () => clearTimeout(timer);
    }
  }, [formData]);

  // Get icon for different transport modes
  const getRouteIcon = (mode: 'air' | 'sea' | 'land'): ReactNode => {
    switch(mode) {
      case 'air': return <Plane className="h-4 w-4" />;
      case 'sea': return <Ship className="h-4 w-4" />;
      case 'land': return <Truck className="h-4 w-4" />;
      default: return <ArrowRightLeft className="h-4 w-4" />;
    }
  };
  
  // Get label for route types
  const getRouteLabel = (routeType: string): { icon: ReactNode; label: string } => {
    switch(routeType) {
      case 'fastest': return { icon: <Clock className="h-4 w-4" />, label: 'Fastest' };
      case 'cheapest': return { icon: <Coins className="h-4 w-4" />, label: 'Cheapest' };
      case 'multimodal': return { icon: <ArrowRightLeft className="h-4 w-4" />, label: 'Multimodal' };
      case 'sustainable': return { icon: <Leaf className="h-4 w-4" />, label: 'Sustainable' };
      default: return { icon: null, label: routeType };
    }
  };

  // Handle route hover/selection
  const handleRouteClick = (route: Route): void => {
    setSelectedRoute(route);
    
    // Toggle expanded state
    if (expandedRouteId === route.route_type) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(route.route_type);
    }
  };

  const handleConfirmRoute = (): void => {
    setStep("confirmation");
    // Force map remount to ensure it renders at right size
    setMapKey(prev => prev + 1);
  };

  const handleBackToRoutes = (): void => {
    setStep("map");
    setSelectedRoute(null);
    setExpandedRouteId(null);
  };

  const toggleRouteVisibility = (routeId: string): void => {
    setActiveRouteIds(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId) 
        : [...prev, routeId]
    );
  };

  if (loading || !routeData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg"></div>
            <Loader2 className="h-16 w-16 text-blue-400" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-blue-200/80 font-medium">
            Calculating optimal routes...
          </p>
        </motion.div>
      </div>
    );
  }

  if (step === "confirmation" && selectedRoute) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handleBackToRoutes}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            &larr; Back to routes
          </Button>
          <Badge 
            variant="outline" 
            className="bg-blue-500/10 text-blue-300 border-blue-300/30 px-3 py-1"
          >
            Shipment #{Math.floor(1000 + Math.random() * 9000)}
          </Badge>
        </div>
        
        <Card className="border border-white/10 bg-[#020617]/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedRoute.mode_icon}
                <span>{selectedRoute.route_name} Selected</span>
              </div>
              <Badge className="bg-green-500/20 text-green-300 border-green-300/30">
                Confirmed
              </Badge>
            </CardTitle>
            <CardDescription className="text-blue-200/70">
              {routeData.source} &rarr; {routeData.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <MapSection 
              compact={true} 
              routeData={routeData} 
              mapCenter={mapCenter}
              activeRouteIds={[selectedRoute.route_type]}
              selectedRoute={selectedRoute}
              handleRouteClick={() => {}}
              toggleRouteVisibility={() => {}}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-blue-200/50">TRANSIT TIME</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  {selectedRoute.total_transit_time_hours} hours
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-blue-200/50">TOTAL COST</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  ${selectedRoute.total_cost_usd.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-blue-200/50">DISTANCE</p>
                <p className="text-xl font-bold">
                  {selectedRoute.total_distance_km.toLocaleString()} km
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-blue-200/50">CO₂ EMISSIONS</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-400" />
                  {selectedRoute.total_co2_emissions_kg.toLocaleString()} kg
                </p>
              </div>
            </div>
            
            <div className="rounded-lg border border-white/10 p-4 space-y-3">
              <h4 className="font-semibold">Route Segments</h4>
              {selectedRoute.segments.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  {getRouteIcon(segment.mode)}
                  <div className="flex-1">
                    <p className="font-medium">{segment.origin} &rarr; {segment.destination}</p>
                    <p className="text-blue-200/60 text-xs">
                      {segment.distance_km} km • {segment.transit_time_hours} hours
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border border-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Shipment Timeline</h4>
              <div className="relative pl-6 space-y-4">
                <div className="absolute top-0 bottom-0 left-2 w-0.5 bg-blue-500/30"></div>
                
                {/* Current date */}
                <div className="relative">
                  <div className="absolute left-[-24px] top-0 h-4 w-4 rounded-full bg-blue-500"></div>
                  <p className="font-medium">Processing</p>
                  <p className="text-xs text-blue-200/60 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString()}
                  </p>
                </div>
                
                {/* Departure */}
                <div className="relative">
                  <div className="absolute left-[-24px] top-0 h-4 w-4 rounded-full bg-blue-500/50"></div>
                  <p className="font-medium">Departure</p>
                  <p className="text-xs text-blue-200/60 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(Date.now() + 2*24*60*60*1000).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Estimated arrival */}
                <div className="relative">
                  <div className="absolute left-[-24px] top-0 h-4 w-4 rounded-full bg-blue-500/20"></div>
                  <p className="font-medium">Estimated Arrival</p>
                  <p className="text-xs text-blue-200/60 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(Date.now() + (2 + selectedRoute.total_transit_time_hours/24)*24*60*60*1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => onSelectRoute(selectedRoute)}
            >
              <Check className="h-4 w-4 mr-2" /> Track Shipment
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={onGoBack}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
        >
          &larr; Back to form
        </Button>
        <Badge 
          variant="outline" 
          className="bg-blue-500/10 text-blue-300 border-blue-300/30 px-3 py-1"
        >
          {routeData.source} &rarr; {routeData.destination}
        </Badge>
      </div>
      
      <MapSection 
        routeData={routeData} 
        mapCenter={mapCenter}
        activeRouteIds={activeRouteIds}
        selectedRoute={selectedRoute}
        handleRouteClick={handleRouteClick}
        toggleRouteVisibility={toggleRouteVisibility}
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Route Recommendations</h3>
          <p className="text-blue-200/70 text-sm">
            Here are the optimal routes based on your shipment details. Select a route to view more details.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Cargo Category</p>
            <p className="text-blue-200/70 text-sm">{routeData.cargo.category || "Documents"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Weight</p>
            <p className="text-blue-200/70 text-sm">{routeData.cargo.weight_kg || 5} kg</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence>
          {routeData.routes.map((route) => {
            const isActive = activeRouteIds.includes(route.route_type);
            const isExpanded = expandedRouteId === route.route_type;
            const { icon, label } = getRouteLabel(route.route_type);
            
            return (
              <motion.div
                key={route.route_type}
                className={`rounded-xl border ${isExpanded ? 'border-blue-500/50' : 'border-white/10'} overflow-hidden`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className={`p-4 cursor-pointer ${isExpanded ? 'bg-blue-900/20' : 'bg-white/5'}`}
                  onClick={() => handleRouteClick(route)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full h-10 w-10 flex items-center justify-center" style={{ backgroundColor: route.color + '20' }}>
                        {route.mode_icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{route.route_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-blue-200/70">
                          {icon}
                          <span>{label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-blue-200/50">TRANSIT TIME</p>
                        <p className="font-medium">{route.total_transit_time_hours} hours</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-200/50">COST</p>
                        <p className="font-medium">${route.total_cost_usd.toLocaleString()}</p>
                      </div>
                      <div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-blue-300" /> : <ChevronDown className="h-5 w-5 text-blue-300" />}
                      </div>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-white/10 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg bg-white/5 text-center">
                            <p className="text-xs text-blue-200/50">DISTANCE</p>
                            <p className="font-semibold">{route.total_distance_km.toLocaleString()} km</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 text-center">
                            <p className="text-xs text-blue-200/50">RELIABILITY</p>
                            <p className="font-semibold">{route.reliability}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 text-center">
                            <p className="text-xs text-blue-200/50">CO₂ EMISSIONS</p>
                            <p className="font-semibold">{route.total_co2_emissions_kg.toLocaleString()} kg</p>
                          </div>
                        </div>
                        
                        {route.segments.length > 1 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold">Route Segments</h4>
                            <div className="space-y-3">
                              {route.segments.map((segment, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-white/5">
                                  {getRouteIcon(segment.mode)}
                                  <div className="flex-1">
                                    <p className="font-medium">{segment.origin} &rarr; {segment.destination}</p>
                                    <p className="text-blue-200/60 text-xs">
                                      {segment.distance_km} km • {segment.transit_time_hours} hours • ${segment.cost_usd}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {route.perishability_suitability === "Low" && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-300 border-red-300/30">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Not suitable for perishables
                            </Badge>
                          )}
                          {route.perishability_suitability === "Medium" && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-300/30">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Limited perishability
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          onClick={() => {
                            setSelectedRoute(route);
                            handleConfirmRoute();
                          }}
                        >
                          Select This Route
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}