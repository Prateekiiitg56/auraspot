import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcon } from "./MapPicker";

interface MapDisplayProps {
  latitude?: number;
  longitude?: number;
  title: string;
  subtitle?: string;
}

/** Read-only map with a single pin for a listing. */
const MapDisplay = ({ latitude, longitude, title, subtitle }: MapDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);

  useEffect(() => {
    if (!containerRef.current || !hasPoint) return;
    const point: L.LatLngTuple = [latitude as number, longitude as number];
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(point, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Build popup content with text nodes: titles are user-supplied and must not be parsed as HTML
    const popup = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = title;
    popup.appendChild(strong);
    if (subtitle) {
      const line = document.createElement("div");
      line.textContent = subtitle;
      popup.appendChild(line);
    }
    L.marker(point, { icon: markerIcon }).addTo(map).bindPopup(popup);

    return () => {
      map.remove();
    };
  }, [latitude, longitude, title, subtitle, hasPoint]);

  if (!hasPoint) {
    return <p className="muted">The owner hasn’t pinned an exact location for this listing.</p>;
  }

  return <div ref={containerRef} className="map-canvas" role="region" aria-label={`Map showing ${title}`} />;
};

export default MapDisplay;
