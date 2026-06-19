/** GeoJSON ST_NM values from dashboard/public/india-states.geojson */
const GEO_STATE_NAMES = [
  "Andaman & Nicobar",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const REGION_TO_GEO = {
  bangalore: "Karnataka",
  bengaluru: "Karnataka",
  "mumbai region": "Maharashtra",
  "chennai city region": "Tamil Nadu",
  "central region trichirapalli": "Tamil Nadu",
  "kochi region": "Kerala",
  kozhikode: "Kerala",
  thiruvananthapuram: "Kerala",
  vijainagar: "Rajasthan",
  "south twenty four parganas": "West Bengal",
  "north twenty four parganas": "West Bengal",
  "not mentioned": null,
};

let dbVariantCache = null;

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "and");
}

function normalizeStateToGeo(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /^not mentioned$/i.test(trimmed)) return null;

  const regionHit = REGION_TO_GEO[normalizeKey(trimmed)];
  if (regionHit) return regionHit;

  const key = normalizeKey(trimmed);
  for (const geo of GEO_STATE_NAMES) {
    if (normalizeKey(geo) === key) return geo;
  }

  for (const geo of GEO_STATE_NAMES) {
    if (key.includes(normalizeKey(geo)) || normalizeKey(geo).includes(key)) {
      if (key.length >= 4) return geo;
    }
  }

  return null;
}

function resolveStateDbVariants(geoName, dbStates) {
  const variants = [];
  for (const raw of dbStates) {
    if (normalizeStateToGeo(raw) === geoName) variants.push(raw);
  }
  if (!variants.length) variants.push(geoName);
  return variants;
}

function primeStateVariantCache(dbStates) {
  dbVariantCache = new Map();
  for (const geo of GEO_STATE_NAMES) {
    dbVariantCache.set(geo, resolveStateDbVariants(geo, dbStates));
  }
  primeStateVariantCache._ready = true;
}

function getStateDbVariants(geoName) {
  return dbVariantCache?.get(geoName) || [geoName];
}

module.exports = {
  GEO_STATE_NAMES,
  normalizeStateToGeo,
  resolveStateDbVariants,
  primeStateVariantCache,
  getStateDbVariants,
};
