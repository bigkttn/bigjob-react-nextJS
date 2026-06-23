"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// กำหนด Type ของ Props ให้ตรงกับที่ CompanyProfile ส่งมา
type LeafletMapProps = {
  lat: number | string | null;
  lng: number | string | null;
  isEditMode: boolean;
  onChangeLocation: (newLat: number, newLng: number) => void;
};

// Custom Icon สำหรับ Marker
const customIcon = L.divIcon({
  html: `<span class="material-symbols-outlined" 
              style="color: #b50000; 
                      font-size: 35px; 
                      display: block; 
                      text-shadow: 2px 2px 2px rgba(0,0,0,0.2);
                      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">
           location_on
         </span>`,
  className: "custom-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component ย่อยสำหรับจัดการเมื่อผู้ใช้ "คลิก" บนแผนที่เพื่อปักหมุดใหม่
function MapClickHandler({
  isEditMode,
  onChangeLocation,
}: {
  isEditMode: boolean;
  onChangeLocation: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isEditMode) {
        onChangeLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component ย่อยสำหรับอัปเดตจุดกึ่งกลาง (Center) ของแผนที่เมื่อพิกัดเปลี่ยนจากภายนอก
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      // ดึงค่าซูมปัจจุบัน ณ วินาทีนั้น มาใช้กับพิกัดใหม่เลย
      const currentZoom = map.getZoom();

      // สั่งให้แผนที่ย้ายไปจุด center ใหม่ โดยคงระยะซูมเดิมไว้
      map.setView(center, currentZoom, {
        animate: true, // เปิดให้มันสไลด์เลื่อนแบบสมูทๆ
        duration: 0.5, // ความเร็วในการสไลด์ (หน่วยเป็นวินาที ปรับเพิ่มลดได้)
      });
    }
  }, [center, map]);

  return null;
}

const LeafletMap = ({
  lat,
  lng,
  isEditMode,
  onChangeLocation,
}: LeafletMapProps) => {
  const API_KEY = "ae32626403be455d96f52f6bcc1a07be"; // ใส่ API Key ของคุณ
  const url = `https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${API_KEY}`;

  const markerRef = useRef<L.Marker>(null);

  // ค่า Default เป็นกรุงเทพฯ หากไม่มีพิกัดถูกส่งมา
  const defaultLat = 13.7563;
  const defaultLng = 100.5018;
  const currentLat = Number(lat) || defaultLat;
  const currentLng = Number(lng) || defaultLng;
  const position: [number, number] = [currentLat, currentLng];

  // จัดการ Event เมื่อผู้ใช้ "ลาก" หมุดเสร็จสิ้น
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onChangeLocation(lat, lng);
        }
      },
    }),
    [onChangeLocation],
  );

  return (
    <div
      style={{
        height: "400px",
        width: "100%",
        borderRadius: "20px",
        overflow: "hidden",
        border: isEditMode ? "2px dashed #1d9bf0" : "none", // เพิ่มกรอบประเพื่อให้รู้ว่าอยู่ในโหมดแก้ไข
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={url}
        />

        {/* อัปเดตมุมมองแผนที่เมื่อพิกัดเปลี่ยน */}
        <MapUpdater center={position} />

        {/* รองรับการคลิกบนแผนที่เพื่อเปลี่ยนพิกัด (เฉพาะโหมดแก้ไข) */}
        <MapClickHandler
          isEditMode={isEditMode}
          onChangeLocation={onChangeLocation}
        />

        <Marker
          position={position}
          icon={customIcon}
          draggable={isEditMode} // ให้ลากได้เฉพาะเมื่ออยู่ในโหมดแก้ไข
          eventHandlers={isEditMode ? eventHandlers : undefined}
          ref={markerRef}
        >
          <Popup>
            {isEditMode ? "ลากหมุดเพื่อเปลี่ยนตำแหน่งที่ตั้ง" : "ที่ตั้งบริษัท"}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
