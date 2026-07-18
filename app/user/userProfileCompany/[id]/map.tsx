"use client";
import dynamic from "next/dynamic";
import styles from "./map.module.css"; // หรือเปลี่ยนพาธ CSS ให้ตรงกับโฟลเดอร์ของคุณ

type LeafletMapProps = {
  lat: number | string | null;
  lng: number | string | null;
  isEditMode: boolean;
  onChangeLocation: (newLat: number, newLng: number) => void;
};

// ใช้ dynamic import โหลดแผนที่แบบ No SSR ไว้ที่นี่
const MapWithNoSSR = dynamic<LeafletMapProps>(
  () => import("@/components/LeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "300px",
          background: "#eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading Map...</p>
      </div>
    ),
  }
);

interface CompanyMapSectionProps {
  latitude: number | string | null;
  longitude: number | string | null;
}

export default function CompanyMapSection({ latitude, longitude }: CompanyMapSectionProps) {
  return (
    <div className={styles.mapWrapper}>
      <MapWithNoSSR
        lat={latitude}
        lng={longitude}
        isEditMode={false}
        onChangeLocation={() => {}}
      />
    </div>
  );
}