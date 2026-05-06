"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + webpack issue)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(
        Math.round(e.latlng.lat * 1e6) / 1e6,
        Math.round(e.latlng.lng * 1e6) / 1e6
      );
    },
  });
  return null;
}

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

export default function MapLocationPicker({
  lat,
  lng,
  onLocationSelect,
  readOnly = false,
}: MapLocationPickerProps) {
  const center: [number, number] =
    lat !== 0 || lng !== 0 ? [lat, lng] : [14.5995, 120.9842];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={lat !== 0 || lng !== 0 ? 15 : 10}
        className="h-full w-full"
        scrollWheelZoom={!readOnly}
        dragging={!readOnly}
        zoomControl={!readOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && onLocationSelect && (
          <MapClickHandler onLocationSelect={onLocationSelect} />
        )}
        {(lat !== 0 || lng !== 0) && (
          <Marker position={[lat, lng]} icon={markerIcon} />
        )}
      </MapContainer>
      {!readOnly && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          Click on the map to set your location
        </div>
      )}
    </div>
  );
}
