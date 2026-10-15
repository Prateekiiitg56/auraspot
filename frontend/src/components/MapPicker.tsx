import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

interface MapPickerProps {
  latitude: number | string;
  longitude: number | string;
  onLocationChange: (lat: number, lon: number) => void;
}

type Suggestion = { lat: string; lon: string; display_name: string; place_id: number };

const INDIA_CENTER: L.LatLngTuple = [20.5937, 78.9629];

// eslint-disable-next-line react-refresh/only-export-components
export const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

const MapPicker = ({ latitude, longitude, onLocationChange }: MapPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onLocationChange);
  onChangeRef.current = onLocationChange;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const lat = Number(latitude);
  const lon = Number(longitude);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) && latitude !== "";

  const placeMarker = (point: L.LatLngTuple) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) markerRef.current.setLatLng(point);
    else markerRef.current = L.marker(point, { icon: markerIcon }).addTo(map);
  };

  // Create the map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView(INDIA_CENTER, 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => onChangeRef.current(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep the marker in sync with the selected coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasPoint) return;
    placeMarker([lat, lon]);
    if (!map.getBounds().contains([lat, lon]) || map.getZoom() < 12) {
      map.setView([lat, lon], Math.max(map.getZoom(), 14));
    }
  }, [lat, lon, hasPoint]);

  // Debounced geocoding (Nominatim usage policy: max 1 request/second)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        setSuggestions(res.ok ? await res.json() : []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const select = (s: Suggestion) => {
    const point: L.LatLngTuple = [parseFloat(s.lat), parseFloat(s.lon)];
    onChangeRef.current(point[0], point[1]);
    mapRef.current?.setView(point, 15);
    setQuery(s.display_name.split(",").slice(0, 2).join(","));
    setSuggestions([]);
  };

  return (
    <div className="map-picker">
      <label htmlFor="map-search">Search an address, or click the map to drop a pin</label>
      <div className="map-search">
        <div className="input-with-icon">
          <Search size={16} aria-hidden="true" />
          <input
            id="map-search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Zoo Road, Guwahati"
            aria-autocomplete="list"
            aria-controls="map-suggestions"
          />
        </div>
        {(suggestions.length > 0 || searching) && (
          <ul id="map-suggestions" className="map-suggestions" role="listbox">
            {searching && suggestions.length === 0 ? (
              <li className="map-suggestion muted">Searching…</li>
            ) : (
              suggestions.map((s) => (
                <li key={s.place_id}>
                  <button type="button" className="map-suggestion" onClick={() => select(s)}>
                    <strong>{s.display_name.split(",")[0]}</strong>
                    <span>{s.display_name.split(",").slice(1, 4).join(",")}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div ref={containerRef} className="map-canvas" />

      <p className="field-hint inline-icon">
        <MapPin size={13} aria-hidden="true" />
        {hasPoint ? (
          <span className="mono">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
        ) : (
          "No location selected yet"
        )}
      </p>
    </div>
  );
};

export default MapPicker;
