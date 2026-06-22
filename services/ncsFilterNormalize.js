const { getBucketDef, INDUSTRY_BUCKETS } = require("./ncsIndustryBuckets");

function isIndustryBucketKey(value) {
  return Boolean(value && getBucketDef(String(value).trim()));
}

function normalizeNcsJobParams(params = {}) {
  const normalized = { ...params };

  if (normalized.functionalArea && isIndustryBucketKey(normalized.functionalArea)) {
    if (!normalized.industry) {
      normalized.industry = String(normalized.functionalArea).trim();
    }
    delete normalized.functionalArea;
  }

  if (
    normalized.industry &&
    normalized.functionalArea &&
    String(normalized.industry).trim() === String(normalized.functionalArea).trim()
  ) {
    delete normalized.functionalArea;
  }

  return normalized;
}

function industryBucketKeys() {
  return INDUSTRY_BUCKETS.map((b) => b.key);
}

module.exports = {
  normalizeNcsJobParams,
  isIndustryBucketKey,
  industryBucketKeys,
};
