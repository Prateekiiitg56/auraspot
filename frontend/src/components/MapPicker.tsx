import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect } from "react";

interface MapPickerProps {
  latitude: number | string;
  longitude: number | string;
  onLocationChange: (lat: number, lon: number) => void;
}

const MapPicker = ({ latitude, longitude, onLocationChange }: MapPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const lat = Number(latitude) || 20.5937;
  const lon = Number(longitude) || 78.9629;

  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(mapContainerRef.current).setView([lat, lon], lat && lon ? 13 : 4);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker if coordinates exist
    if (lat && lon) {
      const icon = L.icon({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        shadowSize: [50, 50]
      });

      markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    }

    // Handle map clicks
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      onLocationChange(clickLat, clickLng);

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        const icon = L.icon({
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [32, 48],
          iconAnchor: [16, 48],
          shadowSize: [50, 50]
        });
        markerRef.current = L.marker([clickLat, clickLng], { icon }).addTo(map);
      }

      map.flyTo([clickLat, clickLng], map.getZoom());
    });

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon]);

  const searchLocation = async (city: string) => {
    if (!city.trim()) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to search locations:", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectLocation = (lat: number, lon: number, name: string) => {
    onLocationChange(lat, lon);
    setSearchCity(name);
    setSuggestions([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 13);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        const icon = L.icon({
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [32, 48],
          iconAnchor: [16, 48],
          shadowSize: [50, 50]
        });
        markerRef.current = L.marker([lat, lon], { icon }).addTo(mapInstanceRef.current);
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <label style={{
          display: "block",
          marginBottom: "8px",
          color: "#cbd5e1",
          fontWeight: "600",
          fontSize: "14px"
        }}>
          🔍 Search Location or Click on Map
        </label>
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <input
            type="text"
            value={searchCity}
            onChange={(e) => {
              setSearchCity(e.target.value);
              searchLocation(e.target.value);
            }}
            placeholder="Search for city or area..."
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "#667eea";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
            }}
          />

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              marginTop: "4px",
              maxHeight: "200px",
              overflowY: "auto",
              zIndex: 1000
            }}>
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    selectLocation(
                      parseFloat(suggestion.lat),
                      parseFloat(suggestion.lon),
                      suggestion.display_name
                    );
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(102, 126, 234, 0.1)" : "none",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(102, 126, 234, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <p style={{ margin: "0", color: "#f1f5f9", fontSize: "13px", fontWeight: "500" }}>
                    📍 {suggestion.display_name.split(",")[0]}
                  </p>
                  <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "11px" }}>
                    {suggestion.display_name.split(",").slice(1, 3).join(",")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {loadingSuggestions && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              marginTop: "4px",
              padding: "12px",
              color: "#94a3b8",
              fontSize: "13px"
            }}>
              Searching...
            </div>
          )}
        </div>

        <p style={{
          margin: "0",
          color: "#94a3b8",
          fontSize: "12px",
          fontStyle: "italic"
        }}>
          💡 Tip: Click on the map to set exact location or search above
        </p>
      </div>

      <div 
        ref={mapContainerRef}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)",
          height: "350px",
          marginBottom: "16px",
          width: "100%"
        }}
      />

      {/* Coordinates Display */}
      {latitude && longitude && (
        <div style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#cbd5e1"
        }}>
          <p style={{ margin: "0" }}>
            📐 <strong>Latitude:</strong> <span style={{ color: "#667eea" }}>{Number(latitude).toFixed(6)}</span>
          </p>
          <p style={{ margin: "4px 0 0 0" }}>
            📐 <strong>Longitude:</strong> <span style={{ color: "#667eea" }}>{Number(longitude).toFixed(6)}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MapPicker;


