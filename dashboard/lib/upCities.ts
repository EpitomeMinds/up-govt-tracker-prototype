import type { Job } from "./types";

/** Minimal job shape for city aggregation (avoids circular imports) */
export interface CityJobRecord {
  cityId: string;
  cityName: string;
  cityLat: number;
  cityLng: number;
  districtName: string;
  postCount: number | null;
  labourType: string;
  labourLabel: string;
  isClosingSoon: boolean;
  postCategory: string;
  categoryLabel: string;
  educationTier: string;
  educationLabel: string;
  post_board: string;
  qualTags: string[];
}

export interface UPCity {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
}

/** Major UP cities / districts with geo coordinates for map placement */
export const UP_CITIES: UPCity[] = [
  {
    id: "lucknow",
    name: "Lucknow",
    aliases: ["lucknow", "sgpgims", "iim lucknow", "dsg office lucknow"],
    lat: 26.8467,
    lng: 80.9462,
  },
  {
    id: "kanpur",
    name: "Kanpur",
    aliases: ["kanpur", "iit kanpur", "iit-kanpur"],
    lat: 26.4499,
    lng: 80.3319,
  },
  {
    id: "varanasi",
    name: "Varanasi",
    aliases: [
      "varanasi",
      "banaras",
      "bhu",
      "iit bhu",
      "hbch",
      "mpmmcc",
      "tmc hbch",
    ],
    lat: 25.3176,
    lng: 82.9739,
  },
  {
    id: "prayagraj",
    name: "Prayagraj",
    aliases: [
      "allahabad",
      "prayagraj",
      "mnnit allahabad",
      "high court allahabad",
    ],
    lat: 25.4358,
    lng: 81.8463,
  },
  {
    id: "agra",
    name: "Agra",
    aliases: ["agra"],
    lat: 27.1767,
    lng: 78.0081,
  },
  {
    id: "meerut",
    name: "Meerut",
    aliases: ["meerut"],
    lat: 28.9845,
    lng: 77.7064,
  },
  {
    id: "ghaziabad",
    name: "Ghaziabad",
    aliases: ["ghaziabad", "noida", "greater noida"],
    lat: 28.6692,
    lng: 77.4538,
  },
  {
    id: "gorakhpur",
    name: "Gorakhpur",
    aliases: ["gorakhpur", "aiims gorakhpur"],
    lat: 26.7606,
    lng: 83.3732,
  },
  {
    id: "jhansi",
    name: "Jhansi",
    aliases: ["jhansi", "sainik school jhansi"],
    lat: 25.4484,
    lng: 78.5685,
  },
  {
    id: "bareilly",
    name: "Bareilly",
    aliases: ["bareilly"],
    lat: 28.367,
    lng: 79.4304,
  },
  {
    id: "aligarh",
    name: "Aligarh",
    aliases: ["aligarh", "am u aligarh"],
    lat: 27.8974,
    lng: 78.088,
  },
  {
    id: "moradabad",
    name: "Moradabad",
    aliases: ["moradabad"],
    lat: 28.8389,
    lng: 78.7733,
  },
  {
    id: "saharanpur",
    name: "Saharanpur",
    aliases: ["saharanpur"],
    lat: 29.968,
    lng: 77.5552,
  },
  {
    id: "muzaffarnagar",
    name: "Muzaffarnagar",
    aliases: ["muzaffarnagar", "atal awasiya vidyalaya muzaffarnagar"],
    lat: 29.4727,
    lng: 77.7085,
  },
  {
    id: "mathura",
    name: "Mathura",
    aliases: ["mathura", "vrindavan"],
    lat: 27.4924,
    lng: 77.6737,
  },
  {
    id: "ayodhya",
    name: "Ayodhya",
    aliases: ["ayodhya", "faizabad"],
    lat: 26.7922,
    lng: 82.1998,
  },
  {
    id: "kushinagar",
    name: "Kushinagar",
    aliases: ["kushinagar", "dbeo kushinagar", "cmo kushinagar"],
    lat: 26.74,
    lng: 83.889,
  },
  {
    id: "sitapur",
    name: "Sitapur",
    aliases: ["sitapur", "dlsa sitapur"],
    lat: 27.5619,
    lng: 80.682,
  },
  {
    id: "etawah",
    name: "Etawah",
    aliases: ["etawah", "dswo etawah"],
    lat: 26.7855,
    lng: 79.015,
  },
  {
    id: "hathras",
    name: "Hathras",
    aliases: ["hathras", "dlsa hathras", "cmo hathras"],
    lat: 27.5959,
    lng: 78.052,
  },
  {
    id: "rampur",
    name: "Rampur",
    aliases: ["rampur", "raza library"],
    lat: 28.81,
    lng: 79.02,
  },
  {
    id: "sonbhadra",
    name: "Sonbhadra",
    aliases: ["sonbhadra"],
    lat: 24.4576,
    lng: 82.6863,
  },
  {
    id: "raebareli",
    name: "Raebareli",
    aliases: ["raebareli", "niper raebareli"],
    lat: 26.201,
    lng: 81.234,
  },
  {
    id: "faizabad",
    name: "Faizabad",
    aliases: ["faizabad district"],
    lat: 26.775,
    lng: 82.15,
  },
  {
    id: "statewide",
    name: "Statewide (All UP)",
    aliases: ["upsssc", "uttar pradesh", "combined lower subordinate"],
    lat: 27.1,
    lng: 80.75,
  },
];

const MAP_BOUNDS = {
  minLat: 23.6,
  maxLat: 30.4,
  minLng: 77.0,
  maxLng: 84.5,
};

export function projectToMap(
  lat: number,
  lng: number,
  width = 560,
  height = 620
): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = MAP_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
  return { x, y };
}

/** Longest alias first to prefer specific matches */
const MATCH_RULES = UP_CITIES.flatMap((city) =>
  city.aliases.map((alias) => ({ city, alias, len: alias.length }))
)
  .sort((a, b) => b.len - a.len)
  .concat(
    UP_CITIES.map((city) => ({
      city,
      alias: city.name.toLowerCase(),
      len: city.name.length,
    }))
  );

export const UP_GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/geojson/states/uttar-pradesh.geojson";

/** Official UP district names (2011 boundaries, open data) */
export const UP_DISTRICTS = [
  "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya",
  "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki",
  "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
  "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
  "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
  "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
  "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
  "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau",
  "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
  "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
  "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
  "Sultanpur", "Unnao", "Varanasi",
] as const;

const CITY_TO_DISTRICT: Record<string, string> = {
  lucknow: "Lucknow",
  kanpur: "Kanpur Nagar",
  varanasi: "Varanasi",
  prayagraj: "Prayagraj",
  agra: "Agra",
  meerut: "Meerut",
  ghaziabad: "Ghaziabad",
  gorakhpur: "Gorakhpur",
  jhansi: "Jhansi",
  bareilly: "Bareilly",
  aligarh: "Aligarh",
  moradabad: "Moradabad",
  saharanpur: "Saharanpur",
  muzaffarnagar: "Muzaffarnagar",
  mathura: "Mathura",
  ayodhya: "Ayodhya",
  faizabad: "Ayodhya",
  kushinagar: "Kushinagar",
  sitapur: "Sitapur",
  etawah: "Etawah",
  hathras: "Hathras",
  rampur: "Rampur",
  sonbhadra: "Sonbhadra",
  raebareli: "Rae Bareli",
};

const DISTRICT_ALIASES: { district: string; alias: string }[] = [
  { district: "Prayagraj", alias: "allahabad" },
  { district: "Rae Bareli", alias: "raebareli" },
  { district: "Rae Bareli", alias: "rae bareli" },
  { district: "Gautam Buddha Nagar", alias: "noida" },
  { district: "Gautam Buddha Nagar", alias: "greater noida" },
  { district: "Kanpur Nagar", alias: "kanpur" },
  { district: "Ayodhya", alias: "faizabad" },
  { district: "Budaun", alias: "badaun" },
  { district: "Hapur", alias: "hapur" },
  { district: "Sambhal", alias: "sambhal" },
];

const DISTRICT_MATCH_RULES = [
  ...DISTRICT_ALIASES.map((r) => ({ ...r, len: r.alias.length })),
  ...UP_DISTRICTS.map((d) => ({ district: d, alias: d.toLowerCase(), len: d.length })),
].sort((a, b) => b.len - a.len);

export function extractDistrictFromJob(job: Job): string {
  const text = `${job.post_board} ${job.post_name} ${job.link || ""}`.toLowerCase();

  for (const rule of DISTRICT_MATCH_RULES) {
    if (text.includes(rule.alias)) {
      return rule.district;
    }
  }

  const city = extractCityFromJob(job);
  if (city.id !== "statewide" && CITY_TO_DISTRICT[city.id]) {
    return CITY_TO_DISTRICT[city.id];
  }

  return "Statewide";
}

export function vacancyChoroplethColor(vacancies: number, max: number): string {
  if (vacancies <= 0) return "#e2e8f0";
  const t = Math.min(vacancies / Math.max(max, 1), 1);
  if (t > 0.75) return "#1e3a8a";
  if (t > 0.5) return "#2563eb";
  if (t > 0.25) return "#3b82f6";
  if (t > 0.08) return "#93c5fd";
  return "#dbeafe";
}

export interface DistrictAggregate {
  district: string;
  listings: number;
  vacancies: number;
  skilledVacancies: number;
  unskilledVacancies: number;
}

export function aggregateByDistrict(jobs: CityJobRecord[]): DistrictAggregate[] {
  const map = new Map<string, DistrictAggregate>();

  for (const job of jobs) {
    const d = job.districtName || "Statewide";
    const v = job.postCount ?? 1;
    const row =
      map.get(d) ||
      ({
        district: d,
        listings: 0,
        vacancies: 0,
        skilledVacancies: 0,
        unskilledVacancies: 0,
      } as DistrictAggregate);

    row.listings += 1;
    row.vacancies += v;
    if (job.labourType === "skilled") row.skilledVacancies += v;
    if (job.labourType === "unskilled") row.unskilledVacancies += v;
    map.set(d, row);
  }

  return Array.from(map.values()).sort((a, b) => b.vacancies - a.vacancies);
}

export function extractCityFromJob(job: Job): UPCity {
  const text = `${job.post_board} ${job.post_name} ${job.link || ""}`.toLowerCase();

  for (const rule of MATCH_RULES) {
    if (text.includes(rule.alias)) {
      return rule.city;
    }
  }

  return UP_CITIES.find((c) => c.id === "statewide")!;
}

export interface CityAggregate {
  cityId: string;
  cityName: string;
  lat: number;
  lng: number;
  listings: number;
  vacancies: number;
  skilledVacancies: number;
  unskilledVacancies: number;
  closingSoon: number;
}

export interface CityDetailStats extends CityAggregate {
  byCategory: { key: string; label: string; count: number; vacancies: number }[];
  byLabour: { key: string; label: string; vacancies: number }[];
  byEducation: { key: string; label: string; vacancies: number }[];
  topBoards: { board: string; listings: number; vacancies: number }[];
  topQualifications: { qual: string; count: number }[];
}

export function aggregateByCity(jobs: CityJobRecord[]): CityAggregate[] {
  const map = new Map<string, CityAggregate>();

  for (const job of jobs) {
    const v = job.postCount ?? 1;
    const row =
      map.get(job.cityId) ||
      ({
        cityId: job.cityId,
        cityName: job.cityName,
        lat: job.cityLat,
        lng: job.cityLng,
        listings: 0,
        vacancies: 0,
        skilledVacancies: 0,
        unskilledVacancies: 0,
        closingSoon: 0,
      } as CityAggregate);

    row.listings += 1;
    row.vacancies += v;
    if (job.labourType === "skilled") row.skilledVacancies += v;
    if (job.labourType === "unskilled") row.unskilledVacancies += v;
    if (job.isClosingSoon) row.closingSoon += 1;
    map.set(job.cityId, row);
  }

  return Array.from(map.values()).sort((a, b) => b.vacancies - a.vacancies);
}

/** All UP cities from catalog merged with job stats (0 if no listings) */
export function buildCityCatalogList(jobs: CityJobRecord[]): CityAggregate[] {
  const statsMap = new Map(aggregateByCity(jobs).map((c) => [c.cityId, c]));

  return UP_CITIES.filter((c) => c.id !== "statewide")
    .map((c) => {
      const stats = statsMap.get(c.id);
      if (stats) return stats;
      return {
        cityId: c.id,
        cityName: c.name,
        lat: c.lat,
        lng: c.lng,
        listings: 0,
        vacancies: 0,
        skilledVacancies: 0,
        unskilledVacancies: 0,
        closingSoon: 0,
      };
    })
    .sort(
      (a, b) =>
        b.vacancies - a.vacancies ||
        a.cityName.localeCompare(b.cityName, "en-IN")
    );
}

export function cityIdsForDistrict(
  jobs: CityJobRecord[],
  district: string
): Set<string> {
  const ids = new Set<string>();
  for (const job of jobs) {
    if (job.districtName === district) ids.add(job.cityId);
  }
  return ids;
}

export function computeCityDetail(
  jobs: CityJobRecord[],
  cityId: string
): CityDetailStats | null {
  const cityJobs = jobs.filter((j) => j.cityId === cityId);
  if (cityJobs.length === 0) return null;

  const base = aggregateByCity(cityJobs)[0];
  if (!base) return null;

  const catMap = new Map<string, { label: string; count: number; vacancies: number }>();
  const labourMap = new Map<string, { label: string; vacancies: number }>();
  const eduMap = new Map<string, { label: string; vacancies: number }>();
  const boardMap = new Map<string, { listings: number; vacancies: number }>();
  const qualMap = new Map<string, number>();

  for (const job of cityJobs) {
    const v = job.postCount ?? 1;

    const cat = catMap.get(job.postCategory) || {
      label: job.categoryLabel,
      count: 0,
      vacancies: 0,
    };
    cat.count += 1;
    cat.vacancies += v;
    catMap.set(job.postCategory, cat);

    const lab = labourMap.get(job.labourType) || {
      label: job.labourLabel,
      vacancies: 0,
    };
    lab.vacancies += v;
    labourMap.set(job.labourType, lab);

    const edu = eduMap.get(job.educationTier) || {
      label: job.educationLabel,
      vacancies: 0,
    };
    edu.vacancies += v;
    eduMap.set(job.educationTier, edu);

    const brd = boardMap.get(job.post_board) || { listings: 0, vacancies: 0 };
    brd.listings += 1;
    brd.vacancies += v;
    boardMap.set(job.post_board, brd);

    for (const q of job.qualTags) {
      qualMap.set(q, (qualMap.get(q) || 0) + 1);
    }
  }

  return {
    ...base,
    byCategory: Array.from(catMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    byLabour: Array.from(labourMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    byEducation: Array.from(eduMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    topBoards: Array.from(boardMap.entries())
      .map(([board, v]) => ({ board, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies)
      .slice(0, 8),
    topQualifications: Array.from(qualMap.entries())
      .map(([qual, count]) => ({ qual, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export function computeDistrictDetail(
  jobs: CityJobRecord[],
  district: string
): CityDetailStats | null {
  const districtJobs = jobs.filter((j) => j.districtName === district);
  if (districtJobs.length === 0) return null;

  const totals = aggregateByDistrict(districtJobs)[0];
  if (!totals) return null;

  const catMap = new Map<string, { label: string; count: number; vacancies: number }>();
  const labourMap = new Map<string, { label: string; vacancies: number }>();
  const eduMap = new Map<string, { label: string; vacancies: number }>();
  const boardMap = new Map<string, { listings: number; vacancies: number }>();
  const qualMap = new Map<string, number>();

  for (const job of districtJobs) {
    const v = job.postCount ?? 1;

    const cat = catMap.get(job.postCategory) || {
      label: job.categoryLabel,
      count: 0,
      vacancies: 0,
    };
    cat.count += 1;
    cat.vacancies += v;
    catMap.set(job.postCategory, cat);

    const lab = labourMap.get(job.labourType) || {
      label: job.labourLabel,
      vacancies: 0,
    };
    lab.vacancies += v;
    labourMap.set(job.labourType, lab);

    const edu = eduMap.get(job.educationTier) || {
      label: job.educationLabel,
      vacancies: 0,
    };
    edu.vacancies += v;
    eduMap.set(job.educationTier, edu);

    const brd = boardMap.get(job.post_board) || { listings: 0, vacancies: 0 };
    brd.listings += 1;
    brd.vacancies += v;
    boardMap.set(job.post_board, brd);

    for (const q of job.qualTags) {
      qualMap.set(q, (qualMap.get(q) || 0) + 1);
    }
  }

  return {
    cityId: district,
    cityName: district,
    lat: 0,
    lng: 0,
    listings: totals.listings,
    vacancies: totals.vacancies,
    skilledVacancies: totals.skilledVacancies,
    unskilledVacancies: totals.unskilledVacancies,
    closingSoon: districtJobs.filter((j) => j.isClosingSoon).length,
    byCategory: Array.from(catMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    byLabour: Array.from(labourMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    byEducation: Array.from(eduMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies),
    topBoards: Array.from(boardMap.entries())
      .map(([board, v]) => ({ board, ...v }))
      .sort((a, b) => b.vacancies - a.vacancies)
      .slice(0, 8),
    topQualifications: Array.from(qualMap.entries())
      .map(([qual, count]) => ({ qual, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export function bubbleRadius(vacancies: number, max: number): number {
  if (max <= 0) return 8;
  const minR = 10;
  const maxR = 42;
  const ratio = Math.sqrt(vacancies / max);
  return minR + ratio * (maxR - minR);
}
