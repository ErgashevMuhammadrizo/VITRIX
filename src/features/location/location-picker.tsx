"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Business } from "../../types";
import { Field, Button } from "../../components/ui/shared";
import {
  validCoordinates,
  mapLink,
  parseMapCoordinates,
} from "./location-utils";
export function LocationPicker({
  value,
  onChange,
}: {
  value: Business;
  onChange: (v: Business) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.Marker | null>(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    let dead = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (dead || !host.current) return;
        const b = latest.current.value;
        const lat = validCoordinates(b.latitude, b.longitude)
          ? b.latitude!
          : 41.3111;
        const lng = validCoordinates(b.latitude, b.longitude)
          ? b.longitude!
          : 69.2797;
        const m = L.map(host.current).setView([lat, lng], 13);
        map.current = m;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(m);
        const pin = L.divIcon({
          className: "vitrix-map-pin",
          html: "<span></span>",
          iconSize: [24, 32],
          iconAnchor: [12, 32],
        });
        const choose = (lat: number, lng: number) =>
          latest.current.onChange({
            ...latest.current.value,
            latitude: Number(lat.toFixed(7)),
            longitude: Number(lng.toFixed(7)),
          });
        marker.current = L.marker([lat, lng], { draggable: true, icon: pin });
        if (validCoordinates(b.latitude, b.longitude)) marker.current.addTo(m);
        m.on("click", (e) => choose(e.latlng.lat, e.latlng.lng));
        marker.current.on("dragend", () => {
          const p = marker.current!.getLatLng();
          choose(p.lat, p.lng);
        });
        observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(host.current);
      })
      .catch(() => {
        if (!dead)
          setError("Xarita yuklanmadi. Koordinata yoki havola kiriting.");
      });
    return () => {
      dead = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (map.current && marker.current) {
      if (validCoordinates(value.latitude, value.longitude)) {
        const p: [number, number] = [value.latitude!, value.longitude!];
        marker.current.setLatLng(p).addTo(map.current);
        map.current.panTo(p);
      } else marker.current.remove();
    }
  }, [value.latitude, value.longitude]);
  return (
    <div className="location-editor">
      <h3>Lokatsiya</h3>
      <p className="muted">
        Manzilni yozing va xaritadan belgilang. Pin joyini surish mumkin.
      </p>
      <div
        className="location-map"
        ref={host}
        aria-label="Lokatsiyani tanlash xaritasi"
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-grid">
        {(["latitude", "longitude"] as const).map((key, i) => (
          <Field
            key={key}
            label={i ? "Uzunlik (longitude)" : "Kenglik (latitude)"}
          >
            <input
              type="number"
              step="0.0000001"
              min={i ? -180 : -90}
              max={i ? 180 : 90}
              value={value[key] ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [key]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>
        ))}
      </div>
      <Field label="Xarita havolasi">
        <input
          type="url"
          placeholder="https://maps.google.com/..."
          maxLength={600}
          value={value.mapUrl || ""}
          onChange={(e) => {
            const coords = parseMapCoordinates(e.target.value);
            onChange({
              ...value,
              mapUrl: e.target.value,
              ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}),
            });
          }}
        />
      </Field>
      <div className="actions">
        <Button
          type="button"
          variant="secondary small"
          disabled={locating}
          onClick={() => {
            if (!navigator.geolocation) {
              setError("Brauzer lokatsiyani qo‘llamaydi.");
              return;
            }
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
              (p) => {
                onChange({
                  ...latest.current.value,
                  latitude: Number(p.coords.latitude.toFixed(7)),
                  longitude: Number(p.coords.longitude.toFixed(7)),
                });
                setLocating(false);
                setError("");
              },
              () => {
                setError("Ruxsat berilmadi. Xaritadan tanlang.");
                setLocating(false);
              },
              { timeout: 15000, enableHighAccuracy: true },
            );
          }}
        >
          {locating ? "Aniqlanmoqda…" : "Joylashuvimni olish"}
        </Button>
        <Button
          type="button"
          variant="secondary small"
          onClick={() =>
            onChange({ ...value, latitude: null, longitude: null, mapUrl: "" })
          }
        >
          Tozalash
        </Button>
        {mapLink(value) && (
          <a
            href={mapLink(value)}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Xaritada tekshirish ↗
          </a>
        )}
      </div>
    </div>
  );
}
