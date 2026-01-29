import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  title: string;
  city: string;
  area: string;
}

const MapDisplay = ({ latitude, longitude, title, city, area }: MapDisplayProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !latitude || !longitude) return;

    // Remove existing map if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map instance
    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker
    const icon = L.icon({
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    
    marker.bindPopup(`
      <div style="color: #333;">
        <p style="margin: 0 0 4px 0; font-weight: 600;">${title}</p>
        <p style="margin: 0; font-size: 12px;">${city}, ${area}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">
          Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}
        </p>
      </div>
    `);

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title, city, area]);

  if (!latitude || !longitude) {
    return (
      <div style={{
        padding: "40px 20px",
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "12px",
        color: "#cbd5e1"
      }}>
        <p>📍 Location coordinates not available</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)",
        height: "400px",
        width: "100%"
      }}
    />
  );
};

export default MapDisplay;
