// components/map-wrapper.tsx
"use client"

import dynamic from 'next/dynamic';
import { ComponentType, PropsWithChildren } from 'react';

// Dynamically import the map component with SSR disabled
const MapWrapper = <P extends object>(Component: ComponentType<P>): ComponentType<P> => {
  return dynamic(() => Promise.resolve(Component), {
    ssr: false
  });
};

export default MapWrapper;