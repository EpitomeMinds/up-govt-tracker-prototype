export interface LiveSourceMeta {
  source: string;
  scrapedAt: string;
  portalUrl: string;
  projectCount?: number;
  sectorCount?: number;
  linkCount?: number;
  liveSectorHits?: number;
  upJobsUrl?: string;
  govtJobsUrl?: string;
  overviewCount?: number;
  opportunityCount?: number;
  error?: string;
}

export interface UpsidaLiveProject {
  id: string;
  district: string;
  name: string;
  title: string;
  sector: string;
  detailUrl: string;
  sourceUrl: string;
  listUrl: string;
  imageUrl?: string | null;
  source: string;
  scrapedAt: string;
}

export interface InvestIndiaSectorLink {
  name: string;
  url: string;
  source: string;
}

export interface InvestUpIndustryOverview {
  indiaScenario: string[];
  upScenario: string[];
  highlights: { label: string }[];
  stats: { value: string; label: string }[];
  otherSections?: { heading: string; bullets: string[] }[];
}

export interface InvestUpOpportunity {
  category: string;
  title: string;
  description: string;
}

export interface InvestUpContact {
  name: string;
  department?: string;
  designation?: string;
  phone?: string;
  email?: string;
}

export interface InvestUpLiveSector {
  id?: string;
  name: string;
  url: string;
  slug: string;
  source: string;
  industryOverview?: InvestUpIndustryOverview | null;
  investmentOpportunities?: InvestUpOpportunity[];
  investmentScore?: number;
  investmentSignal?: string;
  opportunityFormat?: string;
  contacts?: InvestUpContact[];
  policy?: string;
  districtHotspots?: string[];
  isSpecialProject?: boolean;
  detailScraped?: boolean;
}

export interface NcsPortalLink {
  name: string;
  url: string;
  state?: string;
  source?: string;
}

export interface NsdcSectorLink {
  name: string;
  url: string;
  source: string;
}

export interface LiveDataSourcesResponse {
  syncedAt: string;
  upsida: LiveSourceMeta;
  investIndia: LiveSourceMeta;
  ncs: LiveSourceMeta;
  nsdc: LiveSourceMeta;
  investUp: LiveSourceMeta;
  upsidaProjects: UpsidaLiveProject[];
  investIndiaSectors: InvestIndiaSectorLink[];
  investUpSectors?: InvestUpLiveSector[];
  ncsData: {
    upSkillPortals: NcsPortalLink[];
    industryJobLinks: NcsPortalLink[];
  };
  nsdcSectors: NsdcSectorLink[];
}
