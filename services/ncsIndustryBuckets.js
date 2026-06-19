const INDUSTRY_BUCKETS = [
  {
    key: "Manufacturing",
    industries: ["Manufacturing"],
    industryLike: ["%Manufactur%"],
    faLike: ["%Manufactur%", "%Metal Prod%", "%Electronics Manufact%", "%Wooden Product%"],
  },
  {
    key: "Finance & Insurance",
    industries: ["Finance and Insurance", "Finance And Insurance"],
    industryLike: ["%Finance%", "%Insurance%", "%BFSI%"],
    faLike: ["%Finance%", "%Insurance%", "%BFSI%", "%Banking%"],
  },
  {
    key: "IT & Communication",
    industries: ["IT and Communication", "Information Technology", "IT", "Software Engineering"],
    industryLike: ["%IT%", "%Information Techn%", "%Software%", "%Communication%"],
    faLike: ["%IT %", "%IT and%", "%Software%", "%BPO%", "%ITES%"],
  },
  {
    key: "Transport & Logistics",
    industries: ["Transportation and Storage"],
    industryLike: ["%Transport%", "%Storage%"],
    faLike: ["%Logistic%", "%Transport%", "%Delivery%"],
  },
  {
    key: "Retail & Sales",
    industries: ["Retail"],
    industryLike: ["%Retail%"],
    faLike: ["%Retail%", "%Sales%"],
  },
  {
    key: "Healthcare",
    industries: [],
    industryLike: ["%Health%", "%Medical%", "%Pharma%"],
    faLike: ["%Health%", "%Medical%", "%Pharma%", "%Hospital%"],
  },
  {
    key: "Professional Services",
    industries: ["Specialized Professional Services", "Consulting", "Recruiting"],
    industryLike: ["%Professional%", "%Consult%", "%Recruit%"],
    faLike: ["%Consult%", "%Professional%", "%Human Resource%", "%HR %"],
  },
  {
    key: "Other Services",
    industries: [
      "Other Service Activities",
      "Others",
      "Other",
      "OTHERS",
    ],
    industryLike: [],
    faLike: [],
  },
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function matchesLike(text, patterns) {
  const hay = normalizeText(text);
  if (!hay) return false;
  return patterns.some((pat) => {
    const core = pat.replace(/%/g, "").toLowerCase();
    return hay.includes(core);
  });
}

function resolveIndustryBucket(industry, functionalArea) {
  const ind = String(industry || "").trim();
  const fa = String(functionalArea || "").trim();

  if (ind && !/^others?$/i.test(ind)) {
    for (const bucket of INDUSTRY_BUCKETS) {
      if (bucket.industries.some((name) => normalizeText(name) === normalizeText(ind))) {
        return bucket.key;
      }
      if (matchesLike(ind, bucket.industryLike)) return bucket.key;
    }
  }

  for (const bucket of INDUSTRY_BUCKETS) {
    if (bucket.key === "Other Services") continue;
    if (matchesLike(fa, bucket.faLike)) return bucket.key;
  }

  if (ind && /^others?$/i.test(ind)) return "Other Services";
  return "Other Services";
}

function getBucketDef(bucketKey) {
  return INDUSTRY_BUCKETS.find((b) => b.key === bucketKey) || null;
}

function buildIndustryBucketCondition(bucketKey, params, paramPrefix = "indBucket") {
  const bucket = getBucketDef(bucketKey);
  if (!bucket) {
    params[`${paramPrefix}Like`] = `%${bucketKey}%`;
    return "(industry LIKE @indBucketLike OR functional_area LIKE @indBucketLike)";
  }

  const parts = [];
  let idx = 0;

  for (const name of bucket.industries) {
    const key = `${paramPrefix}Ind${idx}`;
    params[key] = name;
    parts.push(`industry = @${key}`);
    idx += 1;
  }

  for (const pat of bucket.industryLike) {
    const key = `${paramPrefix}IndLike${idx}`;
    params[key] = pat;
    parts.push(`industry LIKE @${key}`);
    idx += 1;
  }

  for (const pat of bucket.faLike) {
    const key = `${paramPrefix}FaLike${idx}`;
    params[key] = pat;
    parts.push(`functional_area LIKE @${key}`);
    idx += 1;
  }

  if (bucket.key === "Other Services" && parts.length === 0) {
    return `(industry IS NULL OR TRIM(industry) = '' OR industry IN ('Others','Other','OTHERS'))`;
  }

  return parts.length ? `(${parts.join(" OR ")})` : "(1=0)";
}

module.exports = {
  INDUSTRY_BUCKETS,
  resolveIndustryBucket,
  buildIndustryBucketCondition,
  getBucketDef,
};
