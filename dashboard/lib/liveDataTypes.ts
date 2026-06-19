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
  investUpSectors?: InvestIndiaSectorLink[];
  ncsData: {
    upSkillPortals: NcsPortalLink[];
    industryJobLinks: NcsPortalLink[];
  };
  nsdcSectors: NsdcSectorLink[];
}
