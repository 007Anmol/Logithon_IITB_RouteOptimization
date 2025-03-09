// types/route-map.d.ts
import { ReactNode } from 'react';

declare module '@/components/route-map' {
  export interface FormData {
    senderName: string;
    category: string;
    weight: string;
    quantity: string;
    pickup: string;
    delivery: string;
  }
  
  export interface Coordinates {
    lat: number;
    lng: number;
  }

  export interface RouteSegment {
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

  export interface RouteMapProps {
    formData: FormData;
    onSelectRoute: (route: Route) => void;
    onGoBack: () => void;
  }
}