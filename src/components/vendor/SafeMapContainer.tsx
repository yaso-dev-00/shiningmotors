"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer as LeafletMapContainer, MapContainerProps } from "react-leaflet";

interface SafeMapContainerProps extends MapContainerProps {
  children: React.ReactNode;
}

export const SafeMapContainer = ({ children, ...props }: SafeMapContainerProps) => {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Small delay to ensure container is in DOM
    const timer = setTimeout(() => {
      if (containerRef.current && !initializedRef.current) {
        // Check if container already has a map
        const container = containerRef.current;
        if (!(container as any)._leaflet_id) {
          setShouldRender(true);
          initializedRef.current = true;
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      if (containerRef.current) {
        const container = containerRef.current;
        if ((container as any)._leaflet_id) {
          const L = require("leaflet");
          try {
            const map = (L as any).map._leaflet_id 
              ? (L as any).map 
              : (L.Map && (L.Map as any).get(container)) 
              ? (L.Map as any).get(container)
              : null;
            if (map && typeof map.remove === 'function') {
              map.remove();
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          delete (container as any)._leaflet_id;
        }
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      {shouldRender && (
        <LeafletMapContainer {...props}>
          {children}
        </LeafletMapContainer>
      )}
    </div>
  );
};


