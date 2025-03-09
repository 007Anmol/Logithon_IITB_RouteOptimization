/**
 * Batch Route Optimizer
 * 
 * A utility class that performs route optimization for batch shipments,
 * including clustering, multi-modal routing, and backhaul optimization.
 */

import type { 
    Vehicle, 
    Shipment, 
    OptimizedRoute, 
    TransportMode, 
    Coordinates, 
    ClusterInfo, 
    RouteSegment,
    BackhaulInfo
  } from "@/types/batch-shipping";
  
  interface DirectRouteResult {
    segments: RouteSegment[];
    totalDistance: number;
    totalCost: number;
    totalTime: number;
    totalCO2: number;
  }
  
  interface MultiModalRouteResult extends DirectRouteResult {
    hub?: string;
  }
  
  interface PotentialHub {
    name: string;
    coords: Coordinates;
  }
  
  interface ModeCounts {
    truck: number;
    plane: number;
    ship: number;
  }
  
  export class BatchRouteOptimizer {
    // Global location coordinates for route planning
    private static readonly locationCoords: Record<string, Coordinates> = {
      "Los Angeles, USA": { lat: 34.0522, lng: -118.2437 },
      "New York, USA": { lat: 40.7128, lng: -74.0060 },
      "London, UK": { lat: 51.5074, lng: -0.1278 },
      "Tokyo, Japan": { lat: 35.6762, lng: 139.6503 },
      "Singapore": { lat: 1.3521, lng: 103.8198 },
      "Dubai, UAE": { lat: 25.2048, lng: 55.2708 },
      "Sydney, Australia": { lat: -33.8688, lng: 151.2093 },
      "Mumbai, India": { lat: 19.0760, lng: 72.8777 },
      "Shanghai, China": { lat: 31.2304, lng: 121.4737 },
      "Delhi, India": { lat: 28.7041, lng: 77.1025 },
      "Amsterdam, Netherlands": { lat: 52.3676, lng: 4.9041 },
      "Frankfurt, Germany": { lat: 50.1109, lng: 8.6821 },
      "Hong Kong": { lat: 22.3193, lng: 114.1694 },
      "San Francisco, USA": { lat: 37.7749, lng: -122.4194 },
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
  
    // Available vehicles for transportation
    private static readonly availableVehicles: Vehicle[] = [
      { 
        id: "truck-1", 
        name: "Truck A", 
        type: "truck", 
        capacity: 10000, // kg
        volumeCapacity: 80, // cubic meters
        baseLocation: "New York, USA",
        costPerKm: 0.8,
        co2PerKm: 0.8,
        speedKmh: 80
      },
      { 
        id: "truck-2", 
        name: "Truck B", 
        type: "truck", 
        capacity: 15000, // kg
        volumeCapacity: 100, // cubic meters
        baseLocation: "Los Angeles, USA",
        costPerKm: 0.9,
        co2PerKm: 0.9,
        speedKmh: 75
      },
      { 
        id: "plane-1", 
        name: "Cargo Plane A", 
        type: "plane", 
        capacity: 50000, // kg
        volumeCapacity: 300, // cubic meters
        baseLocation: "New York, USA",
        costPerKm: 8.5,
        co2PerKm: 2.5,
        speedKmh: 800
      },
      { 
        id: "plane-2", 
        name: "Cargo Plane B", 
        type: "plane", 
        capacity: 80000, // kg
        volumeCapacity: 450, // cubic meters
        baseLocation: "London, UK",
        costPerKm: 9.2,
        co2PerKm: 2.7,
        speedKmh: 850
      },
      { 
        id: "ship-1", 
        name: "Container Ship A", 
        type: "ship", 
        capacity: 5000000, // kg
        volumeCapacity: 25000, // cubic meters
        baseLocation: "Singapore",
        costPerKm: 0.4,
        co2PerKm: 0.4,
        speedKmh: 35
      },
      { 
        id: "ship-2", 
        name: "Container Ship B", 
        type: "ship", 
        capacity: 8000000, // kg
        volumeCapacity: 40000, // cubic meters
        baseLocation: "Rotterdam, Netherlands",
        costPerKm: 0.35,
        co2PerKm: 0.35,
        speedKmh: 30
      }
    ];
  
    // Transport node connections for multi-modal planning
    private static readonly transportHubs: Record<string, string[]> = {
      "New York, USA": ["London, UK", "Frankfurt, Germany", "Tokyo, Japan", "Los Angeles, USA"],
      "London, UK": ["New York, USA", "Dubai, UAE", "Delhi, India", "Frankfurt, Germany"],
      "Singapore": ["Hong Kong", "Sydney, Australia", "Mumbai, India", "Tokyo, Japan"],
      "Dubai, UAE": ["London, UK", "Mumbai, India", "Delhi, India", "Frankfurt, Germany"],
      "Frankfurt, Germany": ["New York, USA", "London, UK", "Dubai, UAE", "Hong Kong"]
    };
  
    // Route costs between major hubs (for flight/shipping routes)
    private static readonly routeCosts: Record<string, Record<string, number>> = {
      "New York, USA": {
        "London, UK": 0.85, // Cost multiplier (lower = cheaper route)
        "Frankfurt, Germany": 0.9,
        "Delhi, India": 1.3,
        "Mumbai, India": 1.35,
        "Tokyo, Japan": 1.1,
        "Los Angeles, USA": 0.75
      },
      "London, UK": {
        "New York, USA": 0.85,
        "Dubai, UAE": 0.8,
        "Delhi, India": 0.9,
        "Mumbai, India": 0.95,
        "Frankfurt, Germany": 0.7
      },
      "Dubai, UAE": {
        "Delhi, India": 0.7,
        "Mumbai, India": 0.75,
        "London, UK": 0.8,
        "Frankfurt, Germany": 0.85
      }
    };
  
    /**
     * Generate optimized routes for a batch of shipments
     */
    public static optimizeRoutes(shipments: Shipment[]): OptimizedRoute[] {
      if (!shipments || shipments.length === 0) {
        return [];
      }
  
      try {
        // 1. Group shipments into geographic clusters
        const clusters = this.createShipmentClusters(shipments);
        
        // 2. For each cluster, apply bin packing to assign shipments to vehicles
        const vehicleAssignments = this.assignVehiclesToClusters(clusters);
        
        // 3. Create optimized routes with multi-modal transport where beneficial
        const routes = this.createOptimizedRoutes(vehicleAssignments);
        
        // 4. Apply backhaul optimization to ensure vehicles don't return empty
        return this.optimizeBackhauls(routes);
      } catch (error) {
        console.error("Error in route optimization:", error);
        return [];
      }
    }
  
    /**
     * Create clusters of shipments going to similar geographical regions
     */
    private static createShipmentClusters(shipments: Shipment[]): ClusterInfo[] {
      // Group shipments by destination region
      const destinationGroups: Record<string, Shipment[]> = {};
      
      // First pass: group by destination country/region
      shipments.forEach(shipment => {
        // Extract country from destination
        const destination = shipment.destination;
        const countryParts = destination.split(',');
        const country = countryParts.length > 1 ? countryParts[countryParts.length - 1].trim() : destination;
        
        if (!destinationGroups[country]) {
          destinationGroups[country] = [];
        }
        destinationGroups[country].push(shipment);
      });
      
      // Second pass: for large regions, create sub-clusters
      const clusters: ClusterInfo[] = [];
      
      Object.entries(destinationGroups).forEach(([region, regionShipments]) => {
        // If region has many shipments, create sub-clusters
        if (regionShipments.length > 10) {
          // Group by more specific destination
          const subGroups: Record<string, Shipment[]> = {};
          
          regionShipments.forEach(shipment => {
            const cityParts = shipment.destination.split(',');
            const city = cityParts.length > 0 ? cityParts[0].trim() : shipment.destination;
            
            if (!subGroups[city]) {
              subGroups[city] = [];
            }
            subGroups[city].push(shipment);
          });
          
          // Create cluster for each sub-group
          Object.entries(subGroups).forEach(([city, cityShipments]) => {
            const totalWeight = cityShipments.reduce((sum, s) => sum + s.weight, 0);
            const totalVolume = cityShipments.reduce((sum, s) => sum + this.calculateVolume(s), 0);
            
            clusters.push({
              id: `${region}-${city}-${Date.now()}`,
              name: `${city}, ${region}`,
              shipments: cityShipments,
              totalWeight,
              totalVolume,
              region,
              centroid: this.getCentroidForLocation(city) || { lat: 0, lng: 0 }
            });
          });
        } else {
          // Small region - create single cluster
          const totalWeight = regionShipments.reduce((sum, s) => sum + s.weight, 0);
          const totalVolume = regionShipments.reduce((sum, s) => sum + this.calculateVolume(s), 0);
          
          clusters.push({
            id: `${region}-${Date.now()}`,
            name: region,
            shipments: regionShipments,
            totalWeight,
            totalVolume,
            region,
            centroid: this.getCentroidForRegion(regionShipments)
          });
        }
      });
      
      return clusters;
    }
  
    /**
     * Assign vehicles to clusters using bin packing algorithm
     */
    private static assignVehiclesToClusters(clusters: ClusterInfo[]): {
      cluster: ClusterInfo;
      vehicles: Vehicle[];
    }[] {
      const assignments: { cluster: ClusterInfo; vehicles: Vehicle[] }[] = [];
      
      // Sort clusters by weight (largest first) for better bin packing
      const sortedClusters = [...clusters].sort((a, b) => b.totalWeight - a.totalWeight);
      
      // Clone available vehicles to track remaining capacity
      const availableVehicles = this.availableVehicles.map(v => ({...v}));
      
      // For each cluster, assign appropriate vehicles
      sortedClusters.forEach(cluster => {
        const assignedVehicles: Vehicle[] = [];
        let remainingWeight = cluster.totalWeight;
        let remainingVolume = cluster.totalVolume;
        
        // First, try to find optimal vehicle combinations
        // Sort vehicles by efficiency (cost per capacity)
        const sortedVehicles = [...availableVehicles].sort((a, b) => 
          (a.costPerKm / a.capacity) - (b.costPerKm / b.capacity)
        );
        
        // Assign vehicles based on weight and volume constraints
        while (remainingWeight > 0 || remainingVolume > 0) {
          // Find best vehicle that can handle remaining capacity
          const bestVehicle = sortedVehicles.find(v => 
            v.capacity >= remainingWeight && v.volumeCapacity >= remainingVolume
          );
          
          if (bestVehicle) {
            // We found a single vehicle that can handle entire cluster
            assignedVehicles.push({...bestVehicle});
            remainingWeight = 0;
            remainingVolume = 0;
          } else {
            // Need multiple vehicles - take largest available
            const sortedByCapacity = [...sortedVehicles].sort((a, b) => b.capacity - a.capacity);
            const largestVehicle = sortedByCapacity.length > 0 ? sortedByCapacity[0] : null;
            
            if (largestVehicle) {
              assignedVehicles.push({...largestVehicle});
              remainingWeight = Math.max(0, remainingWeight - largestVehicle.capacity);
              remainingVolume = Math.max(0, remainingVolume - largestVehicle.volumeCapacity);
            } else {
              // If we can't find any more vehicles, break (would be an error case)
              break;
            }
          }
        }
        
        assignments.push({
          cluster,
          vehicles: assignedVehicles
        });
      });
      
      return assignments;
    }
  
    /**
     * Create optimized routes with multi-modal transport where beneficial
     */
    private static createOptimizedRoutes(
      assignments: { cluster: ClusterInfo; vehicles: Vehicle[] }[]
    ): OptimizedRoute[] {
      const routes: OptimizedRoute[] = [];
      
      assignments.forEach(({cluster, vehicles}) => {
        // Get unique origin points from shipments in cluster
        const originPoints = Array.from(new Set(cluster.shipments.map(s => s.origin)));
        
        // For each origin, create a route to the destination
        originPoints.forEach(origin => {
          const shipmentsFromOrigin = cluster.shipments.filter(s => s.origin === origin);
          
          if (shipmentsFromOrigin.length === 0) return;
          
          // Determine if we should use direct route or multi-modal route
          const directRoute = this.calculateDirectRoute(origin, shipmentsFromOrigin);
          const multiModalRoute = this.calculateMultiModalRoute(origin, shipmentsFromOrigin);
          
          // Choose the more cost-effective route
          const finalRoute = directRoute.totalCost <= multiModalRoute.totalCost
            ? directRoute
            : multiModalRoute;
          
          const routeId = `route-${origin}-${cluster.name}-${Date.now()}`;
          routes.push({
            id: routeId,
            name: `${origin} to ${cluster.name}`,
            shipments: shipmentsFromOrigin,
            segments: finalRoute.segments,
            vehicles: vehicles.map(v => v.id),
            totalDistance: finalRoute.totalDistance,
            totalCost: finalRoute.totalCost,
            totalTime: finalRoute.totalTime,
            totalCO2: finalRoute.totalCO2,
            isMultiModal: finalRoute.segments.length > 1
          });
        });
      });
      
      return routes;
    }
  
    /**
     * Calculate most efficient direct route
     */
    private static calculateDirectRoute(origin: string, shipments: Shipment[]): DirectRouteResult {
      if (shipments.length === 0) {
        return {
          segments: [],
          totalDistance: 0,
          totalCost: 0,
          totalTime: 0,
          totalCO2: 0
        };
      }
      
      // Get coordinates
      const originCoords = this.getLocationCoordinates(origin);
      const destination = shipments[0].destination;
      const destCoords = this.getLocationCoordinates(destination);
      
      if (!originCoords || !destCoords) {
        throw new Error(`Invalid coordinates for ${origin} or ${destination}`);
      }
      
      // Calculate distances
      const distance = this.calculateDistance(originCoords, destCoords);
      
      // Decide on transport mode based on distance
      const mode = this.selectOptimalTransportMode(origin, destination, distance);
      
      // Calculate cost based on mode and distance
      // Use route cost modifiers if available for this route
      const baseCost = this.calculateModeCost(mode, distance);
      const costModifier = this.getRouteCostModifier(origin, destination) || 1;
      const cost = baseCost * costModifier;
      
      // Calculate time and emissions
      const time = this.calculateTransitTime(mode, distance);
      const co2 = this.calculateEmissions(mode, distance);
      
      return {
        segments: [
          {
            from: origin,
            to: destination,
            distance,
            mode,
            cost,
            time,
            co2
          }
        ],
        totalDistance: distance,
        totalCost: cost,
        totalTime: time,
        totalCO2: co2
      };
    }
  
    /**
     * Calculate potentially more efficient multi-modal route through hubs
     */
    private static calculateMultiModalRoute(origin: string, shipments: Shipment[]): MultiModalRouteResult {
      if (shipments.length === 0) {
        return {
          segments: [],
          totalDistance: 0,
          totalCost: 0,
          totalTime: 0,
          totalCO2: 0
        };
      }
  
      const destination = shipments[0].destination;
      
      // Find potential transit hubs
      const potentialHubs = this.findPotentialTransitHubs(origin, destination);
      
      if (potentialHubs.length === 0) {
        // No good transit hubs, fall back to direct route
        return this.calculateDirectRoute(origin, shipments);
      }
      
      // Calculate route through each potential hub
      const hubRoutes = potentialHubs.map(hub => {
        // First segment: Origin to Hub
        const originToHubCoords = this.getLocationCoordinates(origin);
        const hubCoords = this.getLocationCoordinates(hub);
        
        if (!originToHubCoords || !hubCoords) {
          throw new Error(`Invalid coordinates for ${origin} or ${hub}`);
        }
        
        const distance1 = this.calculateDistance(originToHubCoords, hubCoords);
        const mode1 = this.selectOptimalTransportMode(origin, hub, distance1);
        const cost1 = this.calculateModeCost(mode1, distance1) * 
          (this.getRouteCostModifier(origin, hub) || 1);
        const time1 = this.calculateTransitTime(mode1, distance1);
        const co2_1 = this.calculateEmissions(mode1, distance1);
        
        // Second segment: Hub to Destination
        const destCoords = this.getLocationCoordinates(destination);
        
        if (!destCoords) {
          throw new Error(`Invalid coordinates for ${destination}`);
        }
        
        const distance2 = this.calculateDistance(hubCoords, destCoords);
        const mode2 = this.selectOptimalTransportMode(hub, destination, distance2);
        const cost2 = this.calculateModeCost(mode2, distance2) * 
          (this.getRouteCostModifier(hub, destination) || 1);
        const time2 = this.calculateTransitTime(mode2, distance2);
        const co2_2 = this.calculateEmissions(mode2, distance2);
        
        // Calculate totals
        return {
          hub,
          segments: [
            {
              from: origin,
              to: hub,
              distance: distance1,
              mode: mode1,
              cost: cost1,
              time: time1,
              co2: co2_1
            },
            {
              from: hub,
              to: destination,
              distance: distance2,
              mode: mode2,
              cost: cost2,
              time: time2,
              co2: co2_2
            }
          ],
          totalDistance: distance1 + distance2,
          totalCost: cost1 + cost2,
          totalTime: time1 + time2 + 3, // Add 3 hours for transit
          totalCO2: co2_1 + co2_2
        };
      });
      
      // Find most cost-effective hub route
      if (hubRoutes.length === 0) {
        return this.calculateDirectRoute(origin, shipments);
      }
      
      let bestRoute = hubRoutes[0];
      for (let i = 1; i < hubRoutes.length; i++) {
        if (hubRoutes[i].totalCost < bestRoute.totalCost) {
          bestRoute = hubRoutes[i];
        }
      }
      
      return {
        segments: bestRoute.segments,
        totalDistance: bestRoute.totalDistance,
        totalCost: bestRoute.totalCost,
        totalTime: bestRoute.totalTime,
        totalCO2: bestRoute.totalCO2,
        hub: bestRoute.hub
      };
    }
  
    /**
     * Apply backhaul optimization to ensure vehicles don't return empty
     */
    private static optimizeBackhauls(routes: OptimizedRoute[]): OptimizedRoute[] {
      // Make a deep copy of routes to avoid modifying the original
      const optimizedRoutes = JSON.parse(JSON.stringify(routes)) as OptimizedRoute[];
      
      // Create a mapping of routes by destination region
      const routesByDest: Record<string, OptimizedRoute[]> = {};
      const routesByOrigin: Record<string, OptimizedRoute[]> = {};
      
      // Group routes by destination and origin regions
      optimizedRoutes.forEach(route => {
        if (route.segments.length === 0) return;
        
        const lastSegment = route.segments[route.segments.length - 1];
        const destination = lastSegment.to;
        const origin = route.segments[0].from;
        
        if (!routesByDest[destination]) {
          routesByDest[destination] = [];
        }
        
        if (!routesByOrigin[origin]) {
          routesByOrigin[origin] = [];
        }
        
        routesByDest[destination].push(route);
        routesByOrigin[origin].push(route);
      });
      
      // For each destination, check if there are routes originating from there
      Object.entries(routesByDest).forEach(([destination, incomingRoutes]) => {
        const outgoingRoutes = routesByOrigin[destination] || [];
        
        // If we have vehicles arriving at this destination, and shipments leaving from it
        if (incomingRoutes.length > 0 && outgoingRoutes.length > 0) {
          // Tag these routes as having backhaul potential
          incomingRoutes.forEach(route => {
            route.hasBackhaul = true;
            
            // Find a potential outgoing route
            if (outgoingRoutes.length > 0) {
              const backhaul = outgoingRoutes[0];
              route.backhaulRoute = backhaul.id;
              
              // Apply cost reduction for backhaul
              const savings = backhaul.totalCost * 0.4; // 40% savings
              
              route.backhaul = {
                routeId: backhaul.id,
                savings: savings,
                destination: backhaul.segments[backhaul.segments.length - 1].to
              };
            }
          });
        }
      });
      
      return optimizedRoutes;
    }
  
    /**
     * Find potential transit hubs for multi-modal routing
     */
    private static findPotentialTransitHubs(origin: string, destination: string): string[] {
      // Check if we have defined hubs for this origin
      const directHubs = this.transportHubs[origin] || [];
      
      // If no direct hubs or we're looking for more options, check major hubs
      const majorHubs = [
        "New York, USA", 
        "London, UK", 
        "Frankfurt, Germany", 
        "Singapore", 
        "Dubai, UAE"
      ];
      
      const potentialHubs = Array.from(new Set([...directHubs, ...majorHubs]));
      
      // Filter out the origin and destination
      return potentialHubs.filter(hub => 
        hub !== origin && 
        hub !== destination
      );
    }
  
    /**
     * Get optimal transport mode based on distance and locations
     */
    private static selectOptimalTransportMode(
      origin: string, 
      destination: string, 
      distance: number
    ): TransportMode {
      // Check if we have ocean between points
      const hasOcean = this.hasOceanBetween(origin, destination);
      
      if (distance < 1000) {
        // Short distance - use truck
        return "truck";
      } else if (distance > 8000 || hasOcean) {
        // Overseas or very long distance
        if (hasOcean && distance > 2000) {
          return "ship";
        } else {
          return "plane";
        }
      } else {
        // Medium-long distance
        return "plane";
      }
    }
  
    /**
     * Calculate cost for a transport mode and distance
     */
    private static calculateModeCost(mode: TransportMode, distance: number): number {
      switch (mode) {
        case "truck":
          return distance * 0.8; // $0.8 per km
        case "plane":
          return distance * 8.5; // $8.5 per km
        case "ship":
          return distance * 0.4; // $0.4 per km
      }
    }
  
    /**
     * Calculate transit time for a mode and distance
     */
    private static calculateTransitTime(mode: TransportMode, distance: number): number {
      switch (mode) {
        case "truck":
          return distance / 80; // 80 km/h average speed
        case "plane":
          return distance / 800 + 4; // 800 km/h plus 4h for airport procedures
        case "ship":
          return distance / 35; // 35 km/h average speed
      }
    }
  
    /**
     * Calculate emissions for a mode and distance
     */
    private static calculateEmissions(mode: TransportMode, distance: number): number {
      switch (mode) {
        case "truck":
          return distance * 0.1; // 0.1 kg CO2 per km per kg
        case "plane":
          return distance * 0.5; // 0.5 kg CO2 per km per kg
        case "ship":
          return distance * 0.03; // 0.03 kg CO2 per km per kg
      }
    }
  
    /**
     * Get route cost modifier based on special routes
     */
    private static getRouteCostModifier(origin: string, destination: string): number | null {
      // Check if we have a defined cost modifier for this route
      if (this.routeCosts[origin]?.[destination]) {
        return this.routeCosts[origin][destination];
      }
      
      // Check reverse direction
      if (this.routeCosts[destination]?.[origin]) {
        return this.routeCosts[destination][origin] * 1.1; // Slightly higher in reverse
      }
      
      return null;
    }
  
    /**
     * Determine if there's an ocean between two locations
     */
    private static hasOceanBetween(origin: string, destination: string): boolean {
      type ContinentType = 'North America' | 'South America' | 'Europe' | 'Asia' | 'Australia' | 'Africa' | 'Unknown';
      
      // Extract regions/continents
      const getContinent = (location: string): ContinentType => {
        const lcLocation = location.toLowerCase();
        
        if (lcLocation.includes("usa") || lcLocation.includes("canada") || lcLocation.includes("mexico")) {
          return "North America";
        } else if (lcLocation.includes("brazil") || lcLocation.includes("argentina")) {
          return "South America";
        } else if (lcLocation.includes("uk") || lcLocation.includes("germany") || lcLocation.includes("france") || 
                  lcLocation.includes("italy") || lcLocation.includes("spain") || lcLocation.includes("russia")) {
          return "Europe";
        } else if (lcLocation.includes("china") || lcLocation.includes("japan") || lcLocation.includes("korea") || 
                  lcLocation.includes("india") || lcLocation.includes("singapore") || lcLocation.includes("thailand")) {
          return "Asia";
        } else if (lcLocation.includes("australia")) {
          return "Australia";
        } else if (lcLocation.includes("egypt") || lcLocation.includes("nigeria") || lcLocation.includes("south africa")) {
          return "Africa";
        }
        
        // Default mapping based on common city names
        if (lcLocation.includes("new york") || lcLocation.includes("los angeles") || lcLocation.includes("chicago") || 
            lcLocation.includes("toronto") || lcLocation.includes("mexico city")) {
          return "North America";
        } else if (lcLocation.includes("london") || lcLocation.includes("paris") || lcLocation.includes("berlin") || 
                  lcLocation.includes("rome") || lcLocation.includes("madrid")) {
          return "Europe";
        } else if (lcLocation.includes("tokyo") || lcLocation.includes("beijing") || lcLocation.includes("delhi") || 
                  lcLocation.includes("mumbai") || lcLocation.includes("shanghai") || lcLocation.includes("hong kong")) {
          return "Asia";
        } else if (lcLocation.includes("sydney") || lcLocation.includes("melbourne")) {
          return "Australia";
        } else if (lcLocation.includes("cairo") || lcLocation.includes("lagos")) {
          return "Africa";
        } else if (lcLocation.includes("são paulo") || lcLocation.includes("buenos aires")) {
          return "South America";
        }
        
        return "Unknown";
      };
      
      const continentOrigin = getContinent(origin);
      const continentDestination = getContinent(destination);
      
      // If continents are different, probably has ocean between
      return continentOrigin !== continentDestination;
    }
  
    /**
     * Get coordinates for a location
     */
    public static getLocationCoordinates(location: string): Coordinates | null {
      // Try exact match
      if (this.locationCoords[location]) {
        return this.locationCoords[location];
      }
      
      // Try to find closest match
      const locations = Object.keys(this.locationCoords);
      for (const loc of locations) {
        if (location.includes(loc) || loc.includes(location)) {
          return this.locationCoords[loc];
        }
      }
      
      // Extract city name and try to match
      const cityParts = location.split(',');
      const city = cityParts.length > 0 ? cityParts[0].trim() : location;
      
      for (const loc of locations) {
        if (loc.includes(city)) {
          return this.locationCoords[loc];
        }
      }
      
      return null;
    }
  
    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    public static calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
      const R = 6371; // Earth's radius in km
      const dLat = this.deg2rad(coords2.lat - coords1.lat);
      const dLon = this.deg2rad(coords2.lng - coords1.lng);
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(coords1.lat)) * Math.cos(this.deg2rad(coords2.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km
      
      return Math.round(distance);
    }
  
    /**
     * Convert degrees to radians
     */
    private static deg2rad(deg: number): number {
      return deg * (Math.PI/180);
    }
  
    /**
     * Calculate volume of a shipment based on dimensions
     */
    private static calculateVolume(shipment: Shipment): number {
      // If dimensions are in format "LxWxH" or "L x W x H"
      if (shipment.dimensions) {
        const dimStr = shipment.dimensions.replace(/\s+/g, '');
        const dims = dimStr.split('x');
        
        if (dims.length === 3) {
          const length = parseFloat(dims[0]) || 0;
          const width = parseFloat(dims[1]) || 0;
          const height = parseFloat(dims[2]) || 0;
          
          if (length && width && height) {
            return (length * width * height) / 1000000; // Convert cm³ to m³
          }
        }
      }
      
      // Fallback: estimate volume based on weight (1000 kg = 1 cubic meter)
      return shipment.weight / 1000;
    }
  
    /**
     * Get centroid for a cluster of shipments
     */
    private static getCentroidForRegion(shipments: Shipment[]): Coordinates {
      // Get unique destinations
      const destinations = Array.from(new Set(shipments.map(s => s.destination)));
      
      // Average the coordinates of all destinations
      let sumLat = 0;
      let sumLng = 0;
      let count = 0;
      
      destinations.forEach(dest => {
        const coords = this.getLocationCoordinates(dest);
        if (coords) {
          sumLat += coords.lat;
          sumLng += coords.lng;
          count++;
        }
      });
      
      if (count === 0) {
        // Fallback to a default coordinate if no matches
        return { lat: 0, lng: 0 };
      }
      
      return {
        lat: sumLat / count,
        lng: sumLng / count
      };
    }
  
    /**
     * Get centroid for a location
     */
    private static getCentroidForLocation(location: string): Coordinates | null {
      return this.getLocationCoordinates(location);
    }
  }