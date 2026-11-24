import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Apartment } from "../../types/apartment.js";
import {
  formatCurrency,
  formatMoveInDate,
  formatPropertyType,
  formatShortPrice,
  getPrimaryUnit,
  searchConfigData,
  type UserStatus,
} from "../data/listings.js";

interface ListingsMapProps {
  listings: Apartment[];
  statusMap: Record<string, UserStatus>;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function ListingsMap({ listings, statusMap }: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [searchConfigData.center.lat, searchConfigData.center.lng],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const apt of listings) {
      const unit = getPrimaryUnit(apt);
      const price = apt.summary.minEffectiveCost ?? unit?.baseRent ?? null;
      const status = statusMap[apt.id] ?? apt.user.status;
      const pinClass =
        status === "interested" || status === "toured" || status === "applied"
          ? "map-price-pin map-price-pin--starred"
          : status === "ruled_out"
            ? "map-price-pin map-price-pin--muted"
            : "map-price-pin";

      const icon = L.divIcon({
        className: "map-price-pin-wrapper",
        html: `<span class="${pinClass}">${escapeHtml(formatShortPrice(price))}</span>`,
        iconSize: [56, 26],
        iconAnchor: [28, 13],
      });

      const pos: L.LatLngExpression = [apt.coordinates.lat, apt.coordinates.lng];
      bounds.push(pos);

      const bedsText = unit
        ? `${unit.beds} bd · ${unit.baths} ba${unit.sqft ? ` · ${unit.sqft.toLocaleString()} sqft` : ""}`
        : "";
      const availText = formatMoveInDate(unit?.availableDate);

      const popupHtml = `
        <div class="map-popup">
          <div class="map-popup__type">${escapeHtml(formatPropertyType(apt.propertyType))} · ${escapeHtml(apt.neighborhood)}</div>
          <div class="map-popup__title">${escapeHtml(apt.name)}</div>
          <div class="map-popup__rent">${escapeHtml(formatCurrency(price))}<span>/mo</span></div>
          <div class="map-popup__meta">${escapeHtml(bedsText)}</div>
          <div class="map-popup__date">Move-in: ${escapeHtml(availText)}</div>
          <a class="map-popup__link" href="${escapeHtml(apt.websiteUrl)}" target="_blank" rel="noopener noreferrer">
            Open listing (${escapeHtml(apt.managementCompany ?? "Direct")}) &rarr;
          </a>
        </div>
      `;

      L.marker(pos, { icon }).bindPopup(popupHtml).addTo(layer);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 });
    }
  }, [listings, statusMap]);

  return (
    <div className="map-shell" aria-label="Interactive Westside Grand Rapids rentals map">
      <div ref={containerRef} className="map-canvas" />
      <p className="map-footnote">
        Click any price pin for details &amp; direct listing link. Approximate
        49504 street-grid placement around Bridge Street &amp; West Grand.
      </p>
    </div>
  );
}
