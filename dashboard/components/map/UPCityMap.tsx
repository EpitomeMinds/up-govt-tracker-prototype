"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { PathOptions } from "leaflet";
import L from "leaflet";
import {
  UP_GEOJSON_URL,
  aggregateByCity,
  aggregateByDistrict,
  buildCityCatalogList,
  bubbleRadius,
  cityIdsForDistrict,
  vacancyChoroplethColor,
  type CityAggregate,
} from "@/lib/upCities";
import type { JobEnriched } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import "leaflet/dist/leaflet.css";

interface Props {
  jobs: JobEnriched[];
  selectedCityId: string;
  selectedDistrict: string;
  onSelectCity: (cityId: string) => void;
  onSelectDistrict: (district: string) => void;
  compact?: boolean;
}

const UP_CENTER: [number, number] = [27.05, 80.75];
const MAP_HEIGHT = 340;
const COMPACT_HEIGHT = 220;
const UP_MAX_BOUNDS: L.LatLngBoundsExpression = [
  [23.5, 76.5],
  [30.5, 84.8],
];

type DistrictFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { district: string; st_nm: string }
>;

function FitBounds({ geojson }: { geojson: GeoJSON.GeoJsonObject | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson as GeoJSON.GeoJsonObject);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 8 });
    }
  }, [geojson, map]);
  return null;
}

export default function UPCityMap({
  jobs,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  compact = false,
}: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [loadError, setLoadError] = useState("");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(UP_GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGeojson(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cityStats = useMemo(() => aggregateByCity(jobs), [jobs]);
  const catalogCities = useMemo(() => buildCityCatalogList(jobs), [jobs]);
  const districtStats = useMemo(() => aggregateByDistrict(jobs), [jobs]);
  const districtMap = useMemo(() => {
    const m = new Map<string, (typeof districtStats)[0]>();
    districtStats.forEach((d) => m.set(d.district, d));
    return m;
  }, [districtStats]);

  const districtCityIds = useMemo(
    () =>
      selectedDistrict ? cityIdsForDistrict(jobs, selectedDistrict) : null,
    [jobs, selectedDistrict]
  );

  const listCities = useMemo(() => {
    let list = catalogCities;
    if (districtCityIds) {
      list = list.filter((c) => districtCityIds.has(c.cityId));
    }
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      list = list.filter((c) => c.cityName.toLowerCase().includes(q));
    }
    return list;
  }, [catalogCities, districtCityIds, citySearch]);

  const maxDistrictVac = Math.max(
    ...districtStats.filter((d) => d.district !== "Statewide").map((d) => d.vacancies),
    1
  );
  const maxCityVac = Math.max(...cityStats.map((c) => c.vacancies), 1);

  const cityMarkers = cityStats.filter((c) => c.cityId !== "statewide");

  const styleDistrict = (feature?: DistrictFeature): PathOptions => {
    const name = feature?.properties?.district || "";
    const stats = districtMap.get(name);
    const vacancies = stats?.vacancies || 0;
    const selected = selectedDistrict === name;

    return {
      fillColor: vacancyChoroplethColor(vacancies, maxDistrictVac),
      weight: selected ? 3 : 1,
      opacity: 1,
      color: selected ? "#ea580c" : "#475569",
      fillOpacity: selected ? 0.82 : 0.62,
    };
  };

  const onEachDistrict = (feature: DistrictFeature, layer: L.Layer) => {
    const name = feature.properties.district;
    const stats = districtMap.get(name);
    const vacancies = stats?.vacancies || 0;
    const listings = stats?.listings || 0;

    layer.bindTooltip(
      `<strong>${name}</strong><br/>${formatCount(vacancies)} vacancies · ${listings} listings`,
      { sticky: true, className: "up-map-tooltip" }
    );

    layer.on({
      click: () => onSelectDistrict(selectedDistrict === name ? "" : name),
      mouseover: (e) => {
        const target = e.target as L.Path;
        target.setStyle({ weight: 2.5, fillOpacity: 0.85 });
      },
      mouseout: (e) => {
        const geoLayer = e.target as L.Path & { feature?: DistrictFeature };
        if (geoLayer.setStyle) {
          geoLayer.setStyle(styleDistrict(geoLayer.feature));
        }
      },
    });
  };

  const mapHeight = compact ? COMPACT_HEIGHT : MAP_HEIGHT;

  return (
    <div className={`map-split card overflow-hidden ${compact ? "flex h-full flex-col border-0 shadow-none" : ""}`}>
      {!compact && (
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Uttar Pradesh map &amp; cities
          </h3>
          <p className="text-[10px] text-slate-500">
            District and city vacancy distribution
          </p>
        </div>
      </div>
      )}

      <div
        className={`grid min-h-0 flex-1 lg:grid-cols-5 ${compact ? "h-full" : ""}`}
        style={compact ? undefined : { minHeight: mapHeight }}
      >
        {/* Left — map */}
        <div
          className="map-split-map relative lg:col-span-3"
          style={compact ? { minHeight: 0 } : { height: mapHeight }}
        >
          {loadError && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/90 p-4 text-sm text-red-600">
              Could not load UP map boundaries: {loadError}
            </div>
          )}

          <MapContainer
            center={UP_CENTER}
            zoom={7}
            minZoom={6}
            maxZoom={12}
            maxBounds={UP_MAX_BOUNDS}
            maxBoundsViscosity={1}
            scrollWheelZoom
            className="z-0 h-full w-full"
            style={{
              background: "#f1f5f9",
              ...(compact ? {} : { height: mapHeight, minHeight: mapHeight }),
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {geojson && (
              <>
                <GeoJSON
                  key={`districts-${selectedDistrict}-${jobs.length}`}
                  data={geojson}
                  style={styleDistrict}
                  onEachFeature={onEachDistrict as L.GeoJSONOptions["onEachFeature"]}
                />
                <FitBounds geojson={geojson} />
              </>
            )}

            {cityMarkers.map((city) => (
              <CityMarkerLayer
                key={city.cityId}
                city={city}
                maxVacancies={maxCityVac}
                selected={selectedCityId === city.cityId}
                onSelect={onSelectCity}
              />
            ))}
          </MapContainer>

          <ChoroplethLegend max={maxDistrictVac} />
        </div>

        {/* Right — city names */}
        <CityListPanel
          cities={listCities}
          selectedCityId={selectedCityId}
          selectedDistrict={selectedDistrict}
          search={citySearch}
          onSearchChange={setCitySearch}
          onSelectCity={onSelectCity}
          onClearDistrict={() => onSelectDistrict("")}
          compact={compact}
          mapHeight={mapHeight}
        />
      </div>
    </div>
  );
}

function CityMarkerLayer({
  city,
  maxVacancies,
  selected,
  onSelect,
}: {
  city: CityAggregate;
  maxVacancies: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const radius = Math.max(6, bubbleRadius(city.vacancies, maxVacancies) * 0.42);

  return (
    <CircleMarker
      center={[city.lat, city.lng]}
      radius={radius}
      pathOptions={{
        color: selected ? "#c2410c" : "#1d4ed8",
        weight: selected ? 3 : 2,
        fillColor: selected ? "#ea580c" : "#2563eb",
        fillOpacity: 0.75,
      }}
      eventHandlers={{
        click: () => onSelect(selected ? "" : city.cityId),
      }}
    >
      <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
        <span className="text-xs font-semibold">{city.cityName}</span>
        <br />
        {formatCount(city.vacancies)} vacancies
      </Tooltip>
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-slate-900">{city.cityName}</p>
          <p className="mt-1 text-slate-600">
            {formatCount(city.vacancies)} vacancies
          </p>
          <p className="text-slate-500">{city.listings} listings</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-orange-600 hover:underline"
            onClick={() => onSelect(city.cityId)}
          >
            View city →
          </button>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function ChoroplethLegend({ max }: { max: number }) {
  const steps = [
    { label: "None", color: vacancyChoroplethColor(0, max) },
    { label: "Low", color: vacancyChoroplethColor(max * 0.1, max) },
    { label: "Med", color: vacancyChoroplethColor(max * 0.35, max) },
    { label: "High", color: vacancyChoroplethColor(max * 0.65, max) },
    { label: "Max", color: vacancyChoroplethColor(max, max) },
  ];

  return (
    <div className="absolute bottom-2 left-2 z-[1000] rounded-md border border-slate-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-sm">
      <p className="mb-1 text-[9px] font-semibold uppercase text-slate-500">
        Districts
      </p>
      <div className="flex items-center gap-0.5">
        {steps.map((s) => (
          <div key={s.label} className="text-center">
            <div
              className="h-2 w-5 rounded-sm border border-slate-300"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[8px] text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityListPanel({
  cities,
  selectedCityId,
  selectedDistrict,
  search,
  onSearchChange,
  onSelectCity,
  onClearDistrict,
  compact = false,
  mapHeight = MAP_HEIGHT,
}: {
  cities: CityAggregate[];
  selectedCityId: string;
  selectedDistrict: string;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectCity: (id: string) => void;
  onClearDistrict: () => void;
  compact?: boolean;
  mapHeight?: number;
}) {
  const withJobs = cities.filter((c) => c.vacancies > 0).length;

  return (
    <aside
      className="map-split-cities flex flex-col lg:col-span-2"
      style={compact ? { minHeight: 0 } : { height: mapHeight, maxHeight: mapHeight }}
    >
      <div className={`border-b border-slate-100 bg-slate-50/80 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
        {!compact && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">
            Cities
            <span className="ml-1 font-normal text-slate-400">
              ({withJobs} open)
            </span>
          </p>
          {selectedDistrict && (
            <button
              type="button"
              onClick={onClearDistrict}
              className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-semibold text-orange-800 hover:bg-orange-200"
            >
              {selectedDistrict} ×
            </button>
          )}
        </div>
        )}
        <div className={compact ? "" : "relative mt-1.5"}>
          <svg
            className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-[11px] outline-none ring-up-saffron focus:ring-1"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-1.5 py-1">
        {cities.length === 0 ? (
          <li className="px-3 py-8 text-center text-xs text-slate-400">
            No cities match your search
          </li>
        ) : (
          cities.map((city, index) => {
            const selected = selectedCityId === city.cityId;
            const hasJobs = city.vacancies > 0;
            return (
              <li key={city.cityId}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectCity(city.cityId === selectedCityId ? "" : city.cityId)
                  }
                  className={`map-city-row ${selected ? "map-city-row-selected" : ""} ${
                    !hasJobs ? "map-city-row-empty" : ""
                  }`}
                >
                  <span className="map-city-rank">{index + 1}</span>
                  <span className="map-city-name">{city.cityName}</span>
                  <span className="map-city-stats">
                    {hasJobs ? (
                      <>
                        <span className="map-city-vacancies">
                          {formatCount(city.vacancies)}
                        </span>
                        <span className="map-city-listings">{city.listings} listings</span>
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
