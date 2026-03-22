"use client";

import { useEffect, useState } from "react";
import type { ThreatPoint } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ff4444",
  high: "#ff8c00",
  medium: "#ffcc00",
  low: "#00aaff",
};

const SEVERITY_SIZE: Record<string, number> = {
  critical: 14,
  high: 11,
  medium: 9,
  low: 7,
};

interface ThreatMapProps {
  threats: ThreatPoint[];
  height?: string;
}

export default function ThreatMap({ threats, height = "500px" }: ThreatMapProps) {
  const [Map, setMap] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    import("react-leaflet").then((mod) => {
      const { MapContainer, TileLayer, CircleMarker, Popup } = mod;

      const MapComponent = () => (
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height, width: "100%", borderRadius: "12px" }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {threats.map((threat) => (
            <CircleMarker
              key={threat.id}
              center={[threat.lat, threat.lng]}
              radius={SEVERITY_SIZE[threat.severity]}
              pathOptions={{
                color: SEVERITY_COLORS[threat.severity],
                fillColor: SEVERITY_COLORS[threat.severity],
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs min-w-[200px]" style={{ color: "#0a0a0f" }}>
                  <div className="font-bold text-sm mb-1">{threat.cve_id || threat.id}</div>
                  <div
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 text-white"
                    style={{ background: SEVERITY_COLORS[threat.severity] }}
                  >
                    {threat.severity.toUpperCase()}
                  </div>
                  <div className="mb-1">{threat.description}</div>
                  <div className="text-[10px] opacity-70">
                    {threat.city ? `${threat.city}, ` : ""}
                    {threat.country}
                  </div>
                  <div className="text-[10px] opacity-50 mt-0.5">{threat.category}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      );

      setMap(() => MapComponent);
    });
  }, [threats, height]);

  if (!Map) {
    return (
      <div
        className="flex items-center justify-center bg-[#12121a] rounded-xl border border-[#2a2a3e]"
        style={{ height }}
      >
        <div className="text-[#a1a1aa] animate-pulse">Loading threat map...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Map />
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3e] rounded-lg p-3 z-[1000]">
        <div className="text-[10px] font-bold text-[#a1a1aa] mb-2 uppercase tracking-wider">
          Severity
        </div>
        {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-2 text-xs text-[#e4e4e7]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: color }}
            />
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </div>
        ))}
      </div>
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3e] rounded-lg p-3 z-[1000]">
        <div className="text-[10px] font-bold text-[#a1a1aa] mb-1 uppercase tracking-wider">
          Active Threats
        </div>
        <div className="text-2xl font-bold text-[#00ff88]">{threats.length}</div>
        <div className="flex gap-3 mt-1">
          {["critical", "high", "medium", "low"].map((s) => (
            <div key={s} className="text-[10px]">
              <span style={{ color: SEVERITY_COLORS[s] }}>
                {threats.filter((t) => t.severity === s).length}
              </span>{" "}
              <span className="text-[#a1a1aa]">{s[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
