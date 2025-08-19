"use client";

import * as React from "react";
import {
  GoogleMap,
  MarkerF,
  CircleF,
  HeatmapLayerF,
  MarkerClustererF,
  useLoadScript,
} from "@react-google-maps/api";

/* Types */
type LatLng = { lat: number; lng: number };
type VehicleStatus = "active" | "idle" | "maintenance" | "offline";
type Vehicle = { id: string; callsign: string; pos: LatLng; status: VehicleStatus };
type GeoFence = { id: string; name: string; center: LatLng; radiusKm: number; color: string };

// Map type helper
type MapType = google.maps.MapTypeId | "roadmap" | "hybrid" | "satellite" | "terrain";

type Props = {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geofences?: GeoFence[];
  cluster?: boolean;
  heatmap?: boolean;
  /** keep center stable; pan only when following */
  followSelected?: boolean;
  /** initial pinned center (optional) */
  initialCenter?: LatLng;
  /** initial zoom (default 12 so pins pop) */
  initialZoom?: number;
  /**
   * Fit the map to all vehicles **once** after load.
   * Defaults to false to avoid any “jumping”; enable if you want an auto-framing start.
   */
  fitToVehiclesOnLoad?: boolean;

  /** NEW: control the Google map type (e.g. "roadmap" | "hybrid") */
  mapTypeId?: MapType;
  /** Show Google’s native map type control (dropdown) */
  showMapTypeControl?: boolean;
};

const DEFAULT_CENTER: LatLng = { lat: -6.5, lng: 147.0 };

export default function GoogleFleetMap({
  vehicles,
  selectedId,
  onSelect,
  geofences = [],
  cluster = true,
  heatmap = false,
  followSelected = false,
  initialCenter,
  initialZoom = 12,
  fitToVehiclesOnLoad = false,
  mapTypeId = "roadmap",
  showMapTypeControl = true,
}: Props) {
  // Only load visualization lib when heatmap is enabled
  const libraries = React.useMemo(
    () => (heatmap ? (["visualization"] as any) : undefined),
    [heatmap]
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  // Keep initial center stable so the map doesn't jump as data updates
  const initialCenterRef = React.useRef<LatLng>(
    initialCenter ?? vehicles[0]?.pos ?? DEFAULT_CENTER
  );
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const mapOptions = React.useMemo<google.maps.MapOptions>(
    () => {
      const hasGoogle = typeof google !== "undefined";
      return {
        mapId: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID as string) || undefined,
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        gestureHandling: "greedy",
        minZoom: 5,
        maxZoom: 18,
        mapTypeId: mapTypeId as google.maps.MapTypeId,
        mapTypeControl: showMapTypeControl,
        mapTypeControlOptions:
          showMapTypeControl && hasGoogle
            ? {
                mapTypeIds: ["roadmap", "hybrid", "satellite", "terrain"],
                position: google.maps.ControlPosition.TOP_RIGHT,
              }
            : undefined,
      };
    },
    [mapTypeId, showMapTypeControl]
  );

  // Keep map type in sync with prop changes
  React.useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(mapTypeId as google.maps.MapTypeId);
    }
  }, [mapTypeId]);

  /** Build a BIG high-contrast circle symbol (very visible on all basemaps) */
  const buildIcon = React.useCallback(
    (
      status: VehicleStatus,
      selected: boolean
    ): google.maps.Symbol | google.maps.Icon | undefined => {
      if (typeof google === "undefined") return undefined;

      const color =
        status === "active"
          ? "#16a34a" // green
          : status === "idle"
          ? "#6b7280" // gray
          : status === "maintenance"
          ? "#eab308" // yellow
          : "#94a3b8"; // slate

      const sym: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: selected ? 14 : 12,
      };
      return sym;
    },
    []
  );

  /** Marker payloads (only once Maps SDK is ready) */
  const markers = React.useMemo(() => {
    if (!isLoaded || typeof google === "undefined") return [];
    return vehicles.map((v) => {
      const isSel = v.id === selectedId;
      return {
        id: v.id,
        position: { lat: Number(v.pos.lat), lng: Number(v.pos.lng) },
        title: v.callsign || v.id,
        icon: buildIcon(v.status, isSel),
        zIndex: isSel ? 10 : 1,
        label:
          v.callsign
            ? ({
                text: v.callsign,
                color: "#0f172a",
                fontSize: "12px",
                fontWeight: "600",
              } as google.maps.MarkerLabel)
            : undefined,
      };
    });
  }, [isLoaded, vehicles, selectedId, buildIcon]);

  /** Heatmap data (guarded) */
  const heatmapData = React.useMemo(() => {
    if (!isLoaded || typeof google === "undefined" || !heatmap) return [];
    return vehicles.map((v) => new google.maps.LatLng(v.pos.lat, v.pos.lng));
  }, [isLoaded, vehicles, heatmap]);

  /** Smooth, throttled "follow selected" */
  const selectedPos = React.useMemo(
    () => vehicles.find((v) => v.id === selectedId)?.pos ?? null,
    [vehicles, selectedId]
  );
  const lastPanTs = React.useRef(0);
  React.useEffect(() => {
    if (!followSelected || !mapRef.current || !selectedPos) return;
    const now = Date.now();
    if (now - lastPanTs.current < 800) return; // throttle ~0.8s
    lastPanTs.current = now;
    mapRef.current.panTo(selectedPos);
  }, [followSelected, selectedPos]);

  /** Fit to all vehicles ONCE after the map loads (optional) */
  const didFitRef = React.useRef(false);
  React.useEffect(() => {
    if (!fitToVehiclesOnLoad || didFitRef.current) return;
    if (!mapRef.current || markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend(m.position));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 64); // padding
      didFitRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToVehiclesOnLoad, isLoaded, markers.length]);

  if (!isLoaded) return <div className="text-sm text-gray-500">Loading map…</div>;

  return (
    <GoogleMap
      center={initialCenterRef.current}
      zoom={initialZoom}
      options={mapOptions}
      onLoad={(m) => (mapRef.current = m)}
      onUnmount={() => (mapRef.current = null)}
      mapContainerStyle={{ width: "100%", height: 420, borderRadius: 8 }}
    >
      {/* Geofences */}
      {geofences.map((z) => (
        <CircleF
          key={z.id}
          center={z.center}
          radius={z.radiusKm * 1000}
          options={{
            strokeColor: z.color,
            strokeOpacity: 0.9,
            strokeWeight: 1,
            fillColor: z.color,
            fillOpacity: 0.12,
            clickable: false,
          }}
        />
      ))}

      {/* Heatmap */}
      {heatmap && heatmapData.length > 0 && (
        <HeatmapLayerF data={heatmapData} options={{ radius: 20, dissipating: true }} />
      )}

      {/* Vehicle Markers */}
      {cluster ? (
        <MarkerClustererF averageCenter maxZoom={17}>
          {(clusterer) => (
            <>
              {markers.map((m) => (
                <MarkerF
                  key={m.id}
                  clusterer={clusterer}
                  position={m.position}
                  icon={m.icon as any}
                  zIndex={m.zIndex}
                  label={m.label}
                  onClick={() => onSelect(m.id)}
                  title={m.title}
                />
              ))}
            </>
          )}
        </MarkerClustererF>
      ) : (
        <>
          {markers.map((m) => (
            <MarkerF
              key={m.id}
              position={m.position}
              icon={m.icon as any}
              zIndex={m.zIndex}
              label={m.label}
              onClick={() => onSelect(m.id)}
              title={m.title}
            />
          ))}
        </>
      )}
    </GoogleMap>
  );
}
