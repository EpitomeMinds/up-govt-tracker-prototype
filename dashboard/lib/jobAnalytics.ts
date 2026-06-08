import type { Job } from "./types";
import { aggregateByCity, extractCityFromJob, extractDistrictFromJob } from "./upCities";

export type EducationTier =
  | "below_10"
  | "10th"
  | "12th"
  | "iti_diploma"
  | "graduate"
  | "post_graduate"
  | "professional";

export type LabourType =
  | "skilled"
  | "semi_skilled"
  | "unskilled"
  | "general";

export type PostCategory =
  | "medical"
  | "teaching"
  | "technical"
  | "clerical"
  | "police_security"
  | "apprentice"
  | "research"
  | "labour_manpower"
  | "general";

export type ApplicationType = "walk_in" | "online" | "offline" | "unknown";

export interface JobEnriched extends Job {
  title: string;
  postCount: number | null;
  qualTags: string[];
  educationTier: EducationTier;
  educationLabel: string;
  labourType: LabourType;
  labourLabel: string;
  postCategory: PostCategory;
  categoryLabel: string;
  applicationType: ApplicationType;
  applicationLabel: string;
  isClosingSoon: boolean;
  cityId: string;
  cityName: string;
  cityLat: number;
  cityLng: number;
  districtName: string;
}

export interface DashboardFilters {
  state: string;
  q: string;
  board: string;
  city: string;
  district: string;
  sort: string;
  order: string;
  educationTier: string;
  labourType: string;
  postCategory: string;
  qualification: string;
  applicationType: string;
  closingSoon: boolean;
  minPosts: string;
}

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  vacancies: number;
}

export interface DashboardAnalytics {
  totalListings: number;
  totalVacancies: number;
  closingSoon: number;
  byEducation: BreakdownItem[];
  byLabour: BreakdownItem[];
  byCategory: BreakdownItem[];
  byBoard: BreakdownItem[];
  byQualTag: BreakdownItem[];
  byApplication: BreakdownItem[];
}

export interface LabourMetric {
  listings: number;
  vacancies: number;
}

export interface LabourChartRow {
  key: string;
  name: string;
  listings: number;
  vacancies: number;
}

export interface StackedLabourRow {
  key: string;
  name: string;
  skilled: number;
  semi_skilled: number;
  unskilled: number;
  general: number;
  total: number;
}

export interface GroupedEducationRow {
  key: string;
  name: string;
  skilled: number;
  semi_skilled: number;
  unskilled: number;
  general: number;
}

export interface BoardLabourRow {
  key: string;
  name: string;
  vacancies: number;
  skilled: number;
  unskilled: number;
}

export interface ExtendedAnalytics extends DashboardAnalytics {
  labourMetrics: Record<LabourType, LabourMetric>;
  labourChartData: LabourChartRow[];
  categoryLabourStack: StackedLabourRow[];
  educationBars: { key: string; name: string; listings: number; vacancies: number }[];
  educationLabourGrouped: GroupedEducationRow[];
  boardVacancyBars: BoardLabourRow[];
  qualDemandBars: { key: string; name: string; listings: number; vacancies: number }[];
  applicationBars: { key: string; name: string; listings: number; vacancies: number }[];
  byCity: { key: string; name: string; listings: number; vacancies: number }[];
  skilledVacancyPct: number;
  unskilledVacancyPct: number;
  semiSkilledVacancyPct: number;
}

export const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All education levels" },
  { value: "below_10", label: "Below 10th (8th pass)" },
  { value: "10th", label: "10th pass" },
  { value: "12th", label: "12th pass" },
  { value: "iti_diploma", label: "ITI / Diploma" },
  { value: "graduate", label: "Graduate (Any Degree)" },
  { value: "post_graduate", label: "Post Graduate" },
  { value: "professional", label: "Professional (MBBS, LLB, CA…)" },
];

export const LABOUR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All labour types" },
  { value: "skilled", label: "Skilled" },
  { value: "semi_skilled", label: "Semi-skilled" },
  { value: "unskilled", label: "Unskilled" },
  { value: "general", label: "General / Other" },
];

export const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "labour_manpower", label: "Labour / Manpower" },
  { value: "medical", label: "Medical / Health" },
  { value: "teaching", label: "Teaching / Faculty" },
  { value: "technical", label: "Technical / Engineering" },
  { value: "clerical", label: "Clerical / Office" },
  { value: "police_security", label: "Police / Security / Forest" },
  { value: "apprentice", label: "Apprenticeship" },
  { value: "research", label: "Research / Academic" },
  { value: "general", label: "General" },
];

export const APPLICATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All application modes" },
  { value: "walk_in", label: "Walk-in interview" },
  { value: "online", label: "Online application" },
  { value: "offline", label: "Offline / other" },
];

const QUAL_SPLIT = /,\s*|\s+and\s+/i;

const GRADUATE_KW =
  /\b(any graduate|any bachelors|b\.a|b\.sc|b\.com|b\.tech|b\.e|bca|bba|b\.ed|b\.pharma|bams|bds|bhms|bpt|bums|llb|cs\b|ca\b)/i;
const PG_KW =
  /\b(any post graduate|any masters|m\.a|m\.sc|m\.com|m\.tech|m\.e|m\.ed|m\.pharma|mba|pgdm|mca|m\.phil|ph\.?d|llm|ms\/ md|m\.ch|dnB)/i;
const PROFESSIONAL_KW = /\b(mbbs|md\b|ms\b|bams|bds|bhms|bpt|llb|ca\/|cma|icwa|b\.ed|m\.ed|gnm)/i;

export function parsePostInfo(postName: string): {
  title: string;
  postCount: number | null;
} {
  const match = postName.match(/^(.+?)\s*[–-]\s*(\d+)\s*Posts?\s*$/i);
  if (match) {
    return {
      title: match[1].trim(),
      postCount: parseInt(match[2], 10),
    };
  }
  return { title: postName.trim(), postCount: null };
}

export function extractQualTags(qualification: string): string[] {
  if (!qualification || qualification === "–") return [];
  return qualification
    .split(QUAL_SPLIT)
    .map((q) => q.trim())
    .filter(Boolean);
}

export function classifyEducationTier(
  qual: string,
  tags: string[]
): { tier: EducationTier; label: string } {
  const text = qual.toLowerCase();
  const joined = tags.join(" ").toLowerCase();

  if (PROFESSIONAL_KW.test(text)) {
    return { tier: "professional", label: "Professional" };
  }
  if (PG_KW.test(text)) {
    return { tier: "post_graduate", label: "Post Graduate" };
  }
  if (GRADUATE_KW.test(text)) {
    return { tier: "graduate", label: "Graduate" };
  }
  if (/\biti\b|diploma|dmlt|mlt/i.test(joined)) {
    return { tier: "iti_diploma", label: "ITI / Diploma" };
  }
  if (/\b12th\b|12 th/i.test(joined)) {
    return { tier: "12th", label: "12th pass" };
  }
  if (/\b10th\b|10 th/i.test(joined)) {
    return { tier: "10th", label: "10th pass" };
  }
  if (/\b8th\b|8 th/i.test(joined)) {
    return { tier: "below_10", label: "Below 10th" };
  }

  if (/\bdegree\b|graduate|bachelor/i.test(text)) {
    return { tier: "graduate", label: "Graduate" };
  }

  return { tier: "graduate", label: "Graduate" };
}

export function classifyLabourType(
  postName: string,
  qualification: string,
  tags: string[]
): { type: LabourType; label: string } {
  const text = `${postName} ${qualification}`.toLowerCase();

  const isUnskilled =
    /\bunskilled\b|\bpeon\b|\bhelper\b|\bsafai\b|\bmali\b|\b8th\b|\b8 th\b/.test(
      text
    ) ||
    (/\b10th\b/.test(text) &&
      !/\b12th\b|\biti\b|diploma|graduate|degree|b\.|mbbs|llb/i.test(text) &&
      /\bconstable\b|\bforest guard\b|\bexcise\b|\bdriver\b|\boperator\b|\baadhaar\b/i.test(
        postName.toLowerCase()
      ));

  const isSkilled =
    /\bskilled\b|\biti\b|\bdiploma\b|\btechnician\b|\bengineer\b|\btechnical\b|\bb\.tech\b|\bb\.e\b|\bscientific\b|\bnursing\b|\bmbbs\b|\bgraduate\b|\bprofessor\b|\bpgt\b|\btgt\b/.test(
      text
    ) && !/\bunskilled\b/.test(text);

  if (/\bskilled\s*&\s*unskilled\b|\bunskilled\s*&\s*skilled\b/i.test(text)) {
    return { type: "general", label: "Mixed skilled/unskilled" };
  }
  if (isUnskilled && !isSkilled) {
    return { type: "unskilled", label: "Unskilled" };
  }
  if (isSkilled) {
    return { type: "skilled", label: "Skilled" };
  }
  if (/\b10th\b|\b12th\b/.test(text) && !GRADUATE_KW.test(qualification)) {
    return { type: "semi_skilled", label: "Semi-skilled" };
  }

  return { type: "general", label: "General" };
}

export function classifyPostCategory(postName: string, qualification: string): {
  category: PostCategory;
  label: string;
} {
  const text = `${postName} ${qualification}`.toLowerCase();

  if (
    /\bskilled\b|\bunskilled\b|\bmanpower\b|\blabour\b|\blabor\b|\bpeon\b|\boperator\b|\baadhaar supervisor\b/.test(
      text
    )
  ) {
    return { category: "labour_manpower", label: "Labour / Manpower" };
  }
  if (
    /\bmbbs\b|\bresident\b|\bnursing\b|\bmedical officer\b|\bdoctor\b|\bhospital\b|\bphysiotherapist\b|\bdmlt\b|\bmlt\b/.test(
      text
    )
  ) {
    return { category: "medical", label: "Medical / Health" };
  }
  if (
    /\bteacher\b|\bpgt\b|\btgt\b|\bprofessor\b|\bfaculty\b|\bteaching\b|\bed\b/.test(
      text
    )
  ) {
    return { category: "teaching", label: "Teaching" };
  }
  if (
    /\bapprentice\b|\bapprenticeship\b/.test(text)
  ) {
    return { category: "apprentice", label: "Apprenticeship" };
  }
  if (
    /\bconstable\b|\bpolice\b|\bexcise\b|\bforest guard\b|\bdefence\b|\bsecurity\b/.test(
      text
    )
  ) {
    return { category: "police_security", label: "Police / Security" };
  }
  if (
    /\bresearch\b|\bjrf\b|\bproject associate\b|\bscientist\b|\binvestigator\b|\bacademic\b/.test(
      text
    )
  ) {
    return { category: "research", label: "Research" };
  }
  if (
    /\bengineer\b|\btechnical\b|\btechnician\b|\bscientific assistant\b|\bb\.tech\b|\biti\b/.test(
      text
    )
  ) {
    return { category: "technical", label: "Technical" };
  }
  if (
    /\bclerk\b|\bsteno\b|\bassistant\b|\blower subordinate\b|\bexecutive\b|\bsecretary\b|\baccountant\b/.test(
      text
    )
  ) {
    return { category: "clerical", label: "Clerical / Office" };
  }

  return { category: "general", label: "General" };
}

export function classifyApplicationType(
  lastDate: string,
  postName: string,
  link: string
): { type: ApplicationType; label: string } {
  const text = `${lastDate} ${postName} ${link}`.toLowerCase();
  if (/walk\s*-?\s*in/i.test(text)) {
    return { type: "walk_in", label: "Walk-in" };
  }
  if (/apply online|online form|online link/i.test(text)) {
    return { type: "online", label: "Online" };
  }
  if (/apply offline|offline/i.test(text)) {
    return { type: "offline", label: "Offline" };
  }
  if (link && !/walk/i.test(lastDate)) {
    return { type: "online", label: "Online" };
  }
  return { type: "unknown", label: "Not specified" };
}

export function isClosingSoonJob(job: Job): boolean {
  if (!job.last_date_parsed) return false;
  const last = new Date(job.last_date_parsed);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  return last >= now && last <= week;
}

export function enrichJob(job: Job): JobEnriched {
  const { title, postCount } = parsePostInfo(job.post_name);
  const qualTags = extractQualTags(job.qualification);
  const education = classifyEducationTier(job.qualification, qualTags);
  const labour = classifyLabourType(job.post_name, job.qualification, qualTags);
  const category = classifyPostCategory(job.post_name, job.qualification);
  const application = classifyApplicationType(
    job.last_date,
    job.post_name,
    job.link
  );
  const city = extractCityFromJob(job);
  const districtName = extractDistrictFromJob(job);

  return {
    ...job,
    title,
    postCount,
    qualTags,
    educationTier: education.tier,
    educationLabel: education.label,
    labourType: labour.type,
    labourLabel: labour.label,
    postCategory: category.category,
    categoryLabel: category.label,
    applicationType: application.type,
    applicationLabel: application.label,
    isClosingSoon: isClosingSoonJob(job),
    cityId: city.id,
    cityName: city.name,
    cityLat: city.lat,
    cityLng: city.lng,
    districtName,
  };
}

export function applyFilters(
  jobs: JobEnriched[],
  filters: DashboardFilters
): JobEnriched[] {
  let result = jobs;

  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.post_board.toLowerCase().includes(q) ||
        j.qualification.toLowerCase().includes(q) ||
        j.advt_no.toLowerCase().includes(q) ||
        j.qualTags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters.board) {
    result = result.filter((j) => j.post_board === filters.board);
  }
  if (filters.city) {
    result = result.filter((j) => j.cityId === filters.city);
  }
  if (filters.district) {
    result = result.filter((j) => j.districtName === filters.district);
  }
  if (filters.educationTier) {
    result = result.filter((j) => j.educationTier === filters.educationTier);
  }
  if (filters.labourType) {
    result = result.filter((j) => j.labourType === filters.labourType);
  }
  if (filters.postCategory) {
    result = result.filter((j) => j.postCategory === filters.postCategory);
  }
  if (filters.qualification) {
    result = result.filter((j) =>
      j.qualTags.some(
        (t) => t.toLowerCase() === filters.qualification.toLowerCase()
      )
    );
  }
  if (filters.applicationType) {
    result = result.filter(
      (j) => j.applicationType === filters.applicationType
    );
  }
  if (filters.closingSoon) {
    result = result.filter((j) => j.isClosingSoon);
  }
  if (filters.minPosts) {
    const min = parseInt(filters.minPosts, 10);
    if (!Number.isNaN(min)) {
      result = result.filter((j) => (j.postCount ?? 0) >= min);
    }
  }

  const sortKey = filters.sort;
  const dir = filters.order === "asc" ? 1 : -1;

  result = [...result].sort((a, b) => {
    if (sortKey === "posts") {
      return ((a.postCount ?? 0) - (b.postCount ?? 0)) * dir;
    }
    if (sortKey === "last_date") {
      const da = a.last_date_parsed || "";
      const db = b.last_date_parsed || "";
      return da.localeCompare(db) * dir;
    }
    if (sortKey === "board") {
      return a.post_board.localeCompare(b.post_board) * dir;
    }
    if (sortKey === "post_name") {
      return a.title.localeCompare(b.title) * dir;
    }
    return a.post_date.localeCompare(b.post_date) * dir;
  });

  return result;
}

function buildBreakdown(
  jobs: JobEnriched[],
  keyFn: (j: JobEnriched) => string,
  labelFn: (key: string, j: JobEnriched) => string
): BreakdownItem[] {
  const map = new Map<string, { count: number; vacancies: number; label: string }>();

  for (const job of jobs) {
    const key = keyFn(job);
    const existing = map.get(key) || {
      count: 0,
      vacancies: 0,
      label: labelFn(key, job),
    };
    existing.count += 1;
    existing.vacancies += job.postCount ?? 1;
    map.set(key, existing);
  }

  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      count: v.count,
      vacancies: v.vacancies,
    }))
    .sort((a, b) => b.vacancies - a.vacancies || b.count - a.count);
}

export function computeAnalytics(jobs: JobEnriched[]): DashboardAnalytics {
  const totalVacancies = jobs.reduce((s, j) => s + (j.postCount ?? 1), 0);

  const qualTagMap = new Map<string, number>();
  for (const job of jobs) {
    for (const tag of job.qualTags) {
      qualTagMap.set(tag, (qualTagMap.get(tag) || 0) + 1);
    }
  }

  const byQualTag = [...qualTagMap.entries()]
    .map(([key, count]) => ({ key, label: key, count, vacancies: count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    totalListings: jobs.length,
    totalVacancies,
    closingSoon: jobs.filter((j) => j.isClosingSoon).length,
    byEducation: buildBreakdown(
      jobs,
      (j) => j.educationTier,
      (_, j) => j.educationLabel
    ),
    byLabour: buildBreakdown(
      jobs,
      (j) => j.labourType,
      (_, j) => j.labourLabel
    ),
    byCategory: buildBreakdown(
      jobs,
      (j) => j.postCategory,
      (_, j) => j.categoryLabel
    ),
    byBoard: buildBreakdown(
      jobs,
      (j) => j.post_board || "Unknown",
      (k) => k
    ).slice(0, 10),
    byQualTag,
    byApplication: buildBreakdown(
      jobs,
      (j) => j.applicationType,
      (_, j) => j.applicationLabel
    ),
  };
}

export function computeExtendedAnalytics(
  jobs: JobEnriched[]
): ExtendedAnalytics {
  const base = computeAnalytics(jobs);

  const labourMetrics: Record<LabourType, LabourMetric> = {
    skilled: { listings: 0, vacancies: 0 },
    semi_skilled: { listings: 0, vacancies: 0 },
    unskilled: { listings: 0, vacancies: 0 },
    general: { listings: 0, vacancies: 0 },
  };

  for (const job of jobs) {
    const v = job.postCount ?? 1;
    labourMetrics[job.labourType].listings += 1;
    labourMetrics[job.labourType].vacancies += v;
  }

  const labourChartData: LabourChartRow[] = (
    Object.keys(labourMetrics) as LabourType[]
  ).map((key) => ({
    key,
    name: LABOUR_OPTIONS.find((o) => o.value === key)?.label || key,
    listings: labourMetrics[key].listings,
    vacancies: labourMetrics[key].vacancies,
  }));

  const categoryMap = new Map<string, StackedLabourRow>();
  for (const job of jobs) {
    const key = job.postCategory;
    const row = categoryMap.get(key) || {
      key,
      name: job.categoryLabel,
      skilled: 0,
      semi_skilled: 0,
      unskilled: 0,
      general: 0,
      total: 0,
    };
    const v = job.postCount ?? 1;
    row[job.labourType] += v;
    row.total += v;
    categoryMap.set(key, row);
  }

  const categoryLabourStack = Array.from(categoryMap.values()).sort(
    (a, b) => b.total - a.total
  );

  const educationMap = new Map<string, GroupedEducationRow>();
  for (const job of jobs) {
    const key = job.educationTier;
    const row = educationMap.get(key) || {
      key,
      name: job.educationLabel,
      skilled: 0,
      semi_skilled: 0,
      unskilled: 0,
      general: 0,
    };
    const v = job.postCount ?? 1;
    row[job.labourType] += v;
    educationMap.set(key, row);
  }

  const educationLabourGrouped = Array.from(educationMap.values());

  const educationBars = base.byEducation.map((e) => ({
    key: e.key,
    name: e.label,
    listings: e.count,
    vacancies: e.vacancies,
  }));

  const boardMap = new Map<string, BoardLabourRow>();
  for (const job of jobs) {
    const key = job.post_board || "Unknown";
    const row = boardMap.get(key) || {
      key,
      name: key,
      vacancies: 0,
      skilled: 0,
      unskilled: 0,
    };
    const v = job.postCount ?? 1;
    row.vacancies += v;
    if (job.labourType === "skilled") row.skilled += v;
    if (job.labourType === "unskilled") row.unskilled += v;
    boardMap.set(key, row);
  }

  const boardVacancyBars = Array.from(boardMap.values()).sort(
    (a, b) => b.vacancies - a.vacancies
  );

  const qualMap = new Map<string, { listings: number; vacancies: number }>();
  for (const job of jobs) {
    for (const tag of job.qualTags) {
      const existing = qualMap.get(tag) || { listings: 0, vacancies: 0 };
      existing.listings += 1;
      existing.vacancies += job.postCount ?? 1;
      qualMap.set(tag, existing);
    }
  }

  const qualDemandBars = Array.from(qualMap.entries())
    .map(([key, v]) => ({
      key,
      name: key,
      listings: v.listings,
      vacancies: v.vacancies,
    }))
    .sort((a, b) => b.vacancies - a.vacancies);

  const applicationBars = base.byApplication.map((a) => ({
    key: a.key,
    name: a.label,
    listings: a.count,
    vacancies: a.vacancies,
  }));

  const byCity = aggregateByCity(jobs).map((c) => ({
    key: c.cityId,
    name: c.cityName,
    listings: c.listings,
    vacancies: c.vacancies,
  }));

  const totalV = base.totalVacancies || 1;

  return {
    ...base,
    labourMetrics,
    labourChartData,
    categoryLabourStack,
    educationBars,
    educationLabourGrouped,
    boardVacancyBars,
    qualDemandBars,
    applicationBars,
    byCity,
    skilledVacancyPct: Math.round(
      (labourMetrics.skilled.vacancies / totalV) * 100
    ),
    unskilledVacancyPct: Math.round(
      (labourMetrics.unskilled.vacancies / totalV) * 100
    ),
    semiSkilledVacancyPct: Math.round(
      (labourMetrics.semi_skilled.vacancies / totalV) * 100
    ),
  };
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

export const DEFAULT_FILTERS: DashboardFilters = {
  state: "UP",
  q: "",
  board: "",
  city: "",
  district: "",
  sort: "post_date",
  order: "desc",
  educationTier: "",
  labourType: "",
  postCategory: "",
  qualification: "",
  applicationType: "",
  closingSoon: false,
  minPosts: "",
};

export function filterLabel(key: keyof DashboardFilters, value: string): string {
  const maps: Record<string, { value: string; label: string }[]> = {
    educationTier: EDUCATION_OPTIONS,
    labourType: LABOUR_OPTIONS,
    postCategory: CATEGORY_OPTIONS,
    applicationType: APPLICATION_OPTIONS,
  };
  const found = maps[key]?.find((o) => o.value === value);
  return found?.label || value;
}
