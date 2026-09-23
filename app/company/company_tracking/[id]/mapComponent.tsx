"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./mapComponent.module.css";

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

export interface LocationInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MapComponentProps {
  selectedLat: number;
  selectedLng: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialAddress?: string;
}

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th&addressdetails=1`
    );
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error("Error fetching address:", error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewController({
  targetPos,
  zoom = 15,
}: {
  targetPos: [number, number];
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetPos && targetPos[0] && targetPos[1]) {
      map.flyTo(targetPos, zoom, { duration: 0.8 });
    }
  }, [targetPos, zoom, map]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapComponent({
  selectedLat,
  selectedLng,
  onLocationSelect,
  initialAddress = "",
}: MapComponentProps) {
  const defaultLat = selectedLat || 13.7563;
  const defaultLng = selectedLng || 100.5018;

  const [currentPosition, setCurrentPosition] = useState<[number, number]>([
    defaultLat,
    defaultLng,
  ]);
  const [searchInput, setSearchInput] = useState(initialAddress);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(() => {
    if (initialAddress) {
      return {
        name: initialAddress.split(",")[0] || initialAddress,
        address: initialAddress,
        lat: defaultLat,
        lng: defaultLng,
      };
    }
    return null;
  });
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch address info initially if coordinates are provided but no initialAddress was set
  useEffect(() => {
    let isCancelled = false;

    if (!initialAddress && selectedLat && selectedLng) {
      reverseGeocode(selectedLat, selectedLng).then((addr) => {
        if (!isCancelled) {
          const firstPart = addr.split(",")[0] || "ตำแหน่งที่เลือก";
          setLocationInfo({
            name: firstPart,
            address: addr,
            lat: selectedLat,
            lng: selectedLng,
          });
          setSearchInput(addr);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedLat, selectedLng, initialAddress]);

  // Handle map click to pin location
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setCurrentPosition([lat, lng]);
      setIsLoadingAddress(true);
      setShowDropdown(false);

      const addressName = await reverseGeocode(lat, lng);
      const placeTitle = addressName.split(",")[0] || "ตำแหน่งที่เลือก";

      setLocationInfo({
        name: placeTitle,
        address: addressName,
        lat,
        lng,
      });
      setSearchInput(addressName);
      setIsLoadingAddress(false);

      if (onLocationSelect) {
        onLocationSelect(lat, lng, addressName);
      }
    },
    [onLocationSelect]
  );

  // Search places via Nominatim
  const executeSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed
        )}&accept-language=th&limit=6&addressdetails=1`
      );
      if (!res.ok) throw new Error("Search request failed");
      const data: SearchResult[] = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle typing with debounced search
  const handleInputChange = (value: string) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        executeSearch(value);
      }, 500);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Handle selecting a place from dropdown
  const handleSelectSearchResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const placeName = item.name || item.display_name.split(",")[0] || "สถานที่สำคัญ";

    setCurrentPosition([lat, lng]);
    setLocationInfo({
      name: placeName,
      address: item.display_name,
      lat,
      lng,
    });
    setSearchInput(item.display_name);
    setShowDropdown(false);

    if (onLocationSelect) {
      onLocationSelect(lat, lng, item.display_name);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleCopyCoord = () => {
    if (locationInfo && navigator?.clipboard) {
      navigator.clipboard.writeText(
        `${locationInfo.lat.toFixed(6)}, ${locationInfo.lng.toFixed(6)}`
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className={styles.mapComponentContainer}>
      {/* 🔍 Search Bar for key locations */}
      <div className={styles.searchContainer} ref={searchContainerRef}>
        <div className={styles.searchInputWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>
            search
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="พิมพ์ค้นหาสถานที่สำคัญ เช่น สยามพารากอน, BTS หมอชิต, เซ็นทรัล..."
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch(searchInput);
              }
            }}
          />
          {searchInput && (
            <button
              type="button"
              className={styles.btnClear}
              onClick={handleClearSearch}
              title="ล้างการค้นหา"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className={styles.btnSearch}
            onClick={() => executeSearch(searchInput)}
            disabled={isSearching}
          >
            {isSearching ? "กำลังค้น..." : "ค้นหา"}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <ul className={styles.searchResultsDropdown}>
            {searchResults.map((item, idx) => (
              <li
                key={`${item.place_id}-${idx}`}
                className={styles.searchResultItem}
                onClick={() => handleSelectSearchResult(item)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", color: "#3182ce", flexShrink: 0, marginTop: "2px" }}
                >
                  location_on
                </span>
                <div className={styles.searchResultText}>
                  <div className={styles.searchResultName}>
                    {item.name || item.display_name.split(",")[0]}
                  </div>
                  <div className={styles.searchResultAddress}>
                    {item.display_name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showDropdown && !isSearching && searchResults.length === 0 && searchInput.trim().length >= 2 && (
          <div className={styles.searchNoResult}>
            ไม่พบสถานที่ &ldquo;{searchInput}&rdquo;
          </div>
        )}
      </div>

      {/* 🗺️ Leaflet Map */}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={currentPosition}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizer />
          <MapViewController targetPos={currentPosition} zoom={16} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {currentPosition[0] && currentPosition[1] && (
            <Marker position={currentPosition} icon={customIcon} />
          )}
        </MapContainer>
      </div>

      {/* 📌 Information Panel */}
      <div className={styles.infoPanel}>
        <div className={styles.infoHeader}>
          <div className={styles.infoBadge}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px", color: "#e53e3e" }}
            >
              pin_drop
            </span>
            <span>ข้อมูลสถานที่ (Location Information)</span>
          </div>
          {locationInfo && (
            <div className={styles.coordBadge} title="พิกัดละติจูด, ลองจิจูด">
              {locationInfo.lat.toFixed(6)}, {locationInfo.lng.toFixed(6)}
            </div>
          )}
        </div>

        {isLoadingAddress ? (
          <div className={styles.infoLoading}>
            <span className={styles.spinner}></span>
            <span>กำลังดึงข้อมูลพิกัดสถานที่...</span>
          </div>
        ) : locationInfo ? (
          <div className={styles.infoContent}>
            <div className={styles.infoTitle}>
              {locationInfo.name || "สถานที่ที่เลือก"}
            </div>
            <div className={styles.infoAddress}>{locationInfo.address}</div>
            <div className={styles.infoFooter}>
              <span className={styles.coordDetail}>
                ละติจูด: <b>{locationInfo.lat.toFixed(6)}</b> &nbsp;|&nbsp; ลองจิจูด:{" "}
                <b>{locationInfo.lng.toFixed(6)}</b>
              </span>
              <button
                type="button"
                className={styles.btnCopyCoord}
                onClick={handleCopyCoord}
              >
                {isCopied ? "คัดลอกแล้ว ✓" : "คัดลอกพิกัด"}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.infoPlaceholder}>
            คลิกบนแผนที่เพื่อปักหมุด หรือพิมพ์ค้นหาชื่อสถานที่สำคัญด้านบน
          </div>
        )}
      </div>
    </div>
  );
}