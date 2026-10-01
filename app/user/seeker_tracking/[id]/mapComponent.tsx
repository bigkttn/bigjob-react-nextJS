"use client";
import Swal from "sweetalert2";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 1. ฟังก์ชันแปลง พิกัด -> ชื่อสถานที่ (Reverse Geocoding)
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

// ดักจับการคลิกบนแผนที่
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const addressName = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, addressName);
    },
  });
  return null;
}

// เลื่อนมุมมองแผนที่อัตโนมัติเมื่อพิกัดเปลี่ยน (เช่น เมื่อค้นหาเจอ)
function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
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

export default function MapComponent({
  selectedLat,
  selectedLng,
  onLocationSelect,
}: MapComponentProps) {
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 2. ฟังก์ชันค้นหาพิกัดจากชื่อสถานที่ (Forward Geocoding)
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchText.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText.trim()
        )}&countrycodes=th&accept-language=th&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const address = data[0].display_name;

        // ส่งพิกัดและชื่อสถานที่กลับไปยังคอมโพเนนต์หลัก
        onLocationSelect(lat, lng, address);
      } else {
        Swal.fire("ไม่พบสถานที่นี้ ลองระบุชื่อหรือเขต/จังหวัดให้ละเอียดขึ้นครับ");
      }
    } catch (error) {
      console.error("Search location error:", error);
      Swal.fire("เกิดข้อผิดพลาดในการค้นหาสถานที่");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* 3. กล่องค้นหาสถานที่ลอยอยู่ด้านบนของแผนที่ */}
      <form
        onSubmit={handleSearchLocation}
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          display: "flex",
          gap: "6px",
          width: "90%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          padding: "6px 8px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <input
          type="text"
          placeholder="พิมพ์ชื่อสถานที่ เช่น มหาวิทยาลัย, อาคาร..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isSearching}
          style={{
            padding: "8px 14px",
            backgroundColor: isSearching ? "#9e9e9e" : "#1976d2",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: isSearching ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
        </button>
      </form>

      {/* แผนที่ */}
      <MapContainer
        center={[selectedLat, selectedLng]}
        zoom={15}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
      >
        <MapResizer />
        <MapViewUpdater center={[selectedLat, selectedLng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {selectedLat && selectedLng && (
          <Marker position={[selectedLat, selectedLng]} icon={customIcon} />
        )}
      </MapContainer>
    </div>
  );
}