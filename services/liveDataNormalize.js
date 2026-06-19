function dedupeByKey(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveCount(metaValue, arrayLength) {
  const meta = Number(metaValue);
  const len = Number(arrayLength) || 0;
  if (Number.isFinite(meta) && meta > 0) return meta;
  return len;
}

function normalizeLiveData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const upsidaProjects = Array.isArray(raw.upsidaProjects) ? raw.upsidaProjects : [];
  const investIndiaSectors = Array.isArray(raw.investIndiaSectors) ? raw.investIndiaSectors : [];
  const nsdcSectors = Array.isArray(raw.nsdcSectors) ? raw.nsdcSectors : [];
  const investUpSectors = Array.isArray(raw.investUpSectors) ? raw.investUpSectors : [];

  const upSkillPortals = dedupeByKey(raw.ncsData?.upSkillPortals ?? [], (p) => `${p.name}|${p.url}`);
  const industryJobLinks = dedupeByKey(raw.ncsData?.industryJobLinks ?? [], (p) => `${p.name}|${p.url}`);

  const ncsLinkCount = upSkillPortals.length + industryJobLinks.length;

  return {
    ...raw,
    syncedAt: raw.syncedAt || new Date().toISOString(),
    upsida: {
      ...raw.upsida,
      portalUrl: raw.upsida?.portalUrl || "https://upsida.in/Home/UpcomingProjects",
      projectCount: resolveCount(raw.upsida?.projectCount, upsidaProjects.length),
    },
    investIndia: {
      ...raw.investIndia,
      portalUrl: raw.investIndia?.portalUrl || "https://www.investindia.gov.in/state/uttar-pradesh",
      sectorCount: resolveCount(raw.investIndia?.sectorCount, investIndiaSectors.length),
    },
    ncs: {
      ...raw.ncs,
      portalUrl: raw.ncs?.portalUrl || "https://www.ncs.gov.in/",
      linkCount: resolveCount(raw.ncs?.linkCount, ncsLinkCount),
    },
    nsdc: {
      ...raw.nsdc,
      portalUrl: raw.nsdc?.portalUrl || "https://www.nsdcindia.org/",
      sectorCount: resolveCount(raw.nsdc?.sectorCount, nsdcSectors.length),
    },
    investUp: {
      ...raw.investUp,
      portalUrl: raw.investUp?.portalUrl || "https://invest.up.gov.in/",
      sectorCount: resolveCount(raw.investUp?.sectorCount, investUpSectors.length),
    },
    upsidaProjects,
    investIndiaSectors,
    investUpSectors,
    nsdcSectors,
    ncsData: { upSkillPortals, industryJobLinks },
  };
}

module.exports = { normalizeLiveData, resolveCount, dedupeByKey };
