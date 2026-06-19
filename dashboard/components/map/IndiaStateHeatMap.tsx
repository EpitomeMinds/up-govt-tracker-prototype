"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import type { PathOptions } from "leaflet";
import L from "leaflet";
import { buildVacancyHeatColorMap, VACANCY_HEAT_RAMP } from "@/lib/indiaStateNormalize";
import { formatCount } from "@/lib/jobAnalytics";
import "leaflet/dist/leaflet.css";

const INDIA_GEOJSON_URL = "/india-states.geojson";
const INDIA_CENTER: [number, number] = [22.5, 79];
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.5, 68],
  [37.5, 97.5],
];

type StateDatum = {
  key: string;
  label: string;
  postings: number;
  vacancies: number;
  applicants: number;
};

interface Props {
  data: StateDatum[];
  onStateClick?: (stateName: string) => void;
  metric?: "vacancies" | "postings";
}

type StateFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { ST_NM: string }
>;

function FitIndiaBounds({ geojson }: { geojson: GeoJSON.GeoJsonObject | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [8, 8], maxZoom: 5 });
    }
  }, [geojson, map]);
  return null;
}

export default function IndiaStateHeatMap({
  data,
  onStateClick,
  metric = "vacancies",
}: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(INDIA_GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setGeojson(json);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load map");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dataByState = useMemo(() => {
    const map = new Map<string, StateDatum>();
    for (const row of data) map.set(row.key, row);
    return map;
  }, [data]);

  const colorByState = useMemo(() => {
    const entries = data.map((row) => ({
      key: row.key,
      value: metric === "postings" ? row.postings : row.vacancies,
    }));
    return buildVacancyHeatColorMap(entries);
  }, [data, metric]);

  const hoveredRow = hovered ? dataByState.get(hovered) : null;

  const styleFeature = (feature?: StateFeature): PathOptions => {
    const name = feature?.properties?.ST_NM ?? "";
    const row = dataByState.get(name);
    const isHovered = hovered === name;
    const fillColor = row ? (colorByState.get(name) ?? VACANCY_HEAT_RAMP[0]) : "#e2e8f0";
    return {
      fillColor,
      fillOpacity: isHovered ? 0.98 : row ? 0.92 : 0.75,
      color: isHovered ? "#1e3a8a" : "#ffffff",
      weight: isHovered ? 2.5 : 1,
    };
  };

  const onEachFeature = (feature: StateFeature, layer: L.Layer) => {
    const name = feature.properties?.ST_NM ?? "";
    const row = dataByState.get(name);

    layer.on({
      mouseover: () => setHovered(name),
      mouseout: () => setHovered(null),
      click: () => {
        if (row && onStateClick) onStateClick(name);
      },
    });

    if (row) {
      layer.bindTooltip(
        `<strong>${name}</strong><br/>Postings: ${formatCount(row.postings)}<br/>Vacancies: ${formatCount(row.vacancies)}`,
        { sticky: true, className: "up-map-tooltip" }
      );
    }
  };

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        Map unavailable: {loadError}
      </div>
    );
  }

  if (!geojson) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading India map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={INDIA_CENTER}
        zoom={4}
        minZoom={4}
        maxZoom={7}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
        style={{ background: "#f1f5f9" }}
      >
        <FitIndiaBounds geojson={geojson} />
        <GeoJSON
          key={`${metric}-${data.length}-${colorByState.size}`}
          data={geojson as GeoJSON.FeatureCollection}
          style={(f) => styleFeature(f as StateFeature)}
          onEachFeature={(f, layer) => onEachFeature(f as StateFeature, layer)}
        />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-white/95 px-2.5 py-2 text-[10px] shadow-md">
        <p className="mb-1 font-semibold text-slate-700">
          {metric === "postings" ? "Postings" : "Vacancies"} heat
        </p>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Low</span>
          <div
            className="h-2.5 w-24 rounded"
            style={{
              background: `linear-gradient(to right, ${VACANCY_HEAT_RAMP.join(", ")})`,
            }}
          />
          <span className="text-slate-500">High</span>
        </div>
        {hoveredRow ? (
          <p className="mt-1 font-medium text-blue-700">
            {hovered}: {formatCount(metric === "postings" ? hoveredRow.postings : hoveredRow.vacancies)}
          </p>
        ) : (
          <p className="mt-1 text-slate-500">Click a state to drill down</p>
        )}
      </div>
    </div>
  );
}
