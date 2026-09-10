"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`
    );
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (error) {
    console.error("Error fetching address:", error);
    return `${lat}, ${lng}`;
  }
};

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const addressName = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, addressName);
    },
  });
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

interface MapComponentProps {
  selectedLat: number;
  selectedLng: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

export default function MapComponent({ selectedLat, selectedLng, onLocationSelect }: MapComponentProps) {
  return (
    <MapContainer
      center={[selectedLat, selectedLng]}
      zoom={15}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
      <MapResizer />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      {selectedLat && selectedLng && (
        <Marker position={[selectedLat, selectedLng]} icon={customIcon} />
      )}
    </MapContainer>
  );
}