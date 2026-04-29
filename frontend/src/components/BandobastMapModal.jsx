import React, { useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix the default marker icon paths (Leaflet's built-in assets break under
// webpack/CRA bundling). Use the public CDN copy.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitToBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

export default function BandobastMapModal({ open, onClose, bandobastName, pointWise }) {
  // Filter to only points that have valid coordinates
  const mapped = useMemo(() => {
    return (pointWise || [])
      .map(({ point, staff }) => ({
        ...point,
        staff: staff || [],
      }))
      .filter(
        (p) =>
          p.latitude !== null &&
          p.latitude !== undefined &&
          p.longitude !== null &&
          p.longitude !== undefined &&
          !isNaN(Number(p.latitude)) &&
          !isNaN(Number(p.longitude))
      )
      .map((p) => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      }));
  }, [pointWise]);

  const center = mapped.length
    ? [mapped[0].latitude, mapped[0].longitude]
    : [20.5293, 76.1815]; // Buldhana fallback

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-5xl w-[95vw]" data-testid="map-view-modal">
        <DialogHeader>
          <DialogTitle>
            🗺️ Map View — {bandobastName}{" "}
            <span className="text-sm font-normal text-[#6B7280] ml-2">
              {mapped.length} point{mapped.length === 1 ? "" : "s"} on map
            </span>
          </DialogTitle>
        </DialogHeader>

        {mapped.length === 0 ? (
          <div className="py-12 text-center text-[#6B7280]">
            No points have valid latitude / longitude. Edit the bandobast to add
            coordinates.
          </div>
        ) : (
          <div
            className="w-full h-[70vh] rounded-md overflow-hidden border border-[#E5E7EB]"
            data-testid="map-view-container"
          >
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToBounds points={mapped} />
              {mapped.map((p) => (
                <Marker key={p.id} position={[p.latitude, p.longitude]}>
                  <Popup maxWidth={320}>
                    <div className="text-sm">
                      <div className="font-bold text-[#0A0A0A] text-base mb-1">
                        {p.point_name}
                      </div>
                      {p.sector && (
                        <div className="text-xs text-[#6B7280] mb-1">
                          Sector: {p.sector}
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-[#6B7280] mb-2">
                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </div>
                      {p.staff && p.staff.length > 0 ? (
                        <div className="border-t pt-2">
                          <div className="text-xs font-semibold mb-1">
                            Staff ({p.staff.length}):
                          </div>
                          <ul className="text-xs space-y-0.5 max-h-40 overflow-y-auto">
                            {p.staff.map((s) => (
                              <li key={s.id}>
                                <span className="font-medium">{s.name}</span>
                                {s.rank ? (
                                  <span className="text-[#6B7280]">
                                    {" "}
                                    · {s.rank}
                                  </span>
                                ) : null}
                                {s.bakkal_no &&
                                s.staff_type !== "officer" ? (
                                  <span className="text-[#6B7280] font-mono">
                                    {" "}
                                    · B{s.bakkal_no}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-xs text-[#6B7280] italic border-t pt-2">
                          No staff allotted
                        </div>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#2E3192] hover:underline mt-2 inline-block"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
