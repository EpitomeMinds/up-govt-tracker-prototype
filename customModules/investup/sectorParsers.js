const cheerio = require("cheerio");

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeOpportunities(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.category}|${item.title}|${item.description.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseCarouselOpportunities($, tab) {
  const opportunities = [];

  tab.find(".flip-items li .fliper-div, .fliper-div").each((_, card) => {
    const h3 = normalizeText($(card).find("h3").first().text());
    const paragraph = $(card).find("p").first();
    const strong = normalizeText(paragraph.find("strong, b").first().text());
    const description = normalizeText(paragraph.text());

    if (!description || description.length < 8) return;

    let category = "Key Investment Opportunities";
    let title = h3;

    if (h3 && /primary|other opportunities/i.test(h3)) {
      category = h3;
      title = strong.replace(/\s*[-–—]\s*$/, "").trim();
      let body = description;
      if (title && body.startsWith(title)) {
        body = normalizeText(body.slice(title.length).replace(/^[-–—]\s*/, ""));
      }
      if (body.length > 8) {
        opportunities.push({ category, title: title || category, description: body });
      }
      return;
    }

    if (h3 && !strong) {
      opportunities.push({ category, title: h3, description });
      return;
    }

    if (strong) {
      title = strong.replace(/\s*[-–—]\s*$/, "").trim();
      let body = description;
      if (title && body.startsWith(title)) {
        body = normalizeText(body.slice(title.length).replace(/^[-–—]\s*/, ""));
      }
      opportunities.push({ category, title: title || description.slice(0, 80), description: body || description });
      return;
    }

    opportunities.push({ category, title: description.slice(0, 80), description });
  });

  return opportunities;
}

function parseBulletListOpportunities($, tab) {
  const opportunities = [];
  const intro = normalizeText(tab.find("p").first().text());

  if (intro.length > 40 && !/content will be available soon/i.test(intro)) {
    opportunities.push({
      category: "Overview",
      title: "Investment Landscape",
      description: intro,
    });
  }

  let currentSection = "Investment Regions";
  tab.find("h4, ul.bullets, ul.bullets1, ul.bullets3").each((_, el) => {
    if (el.tagName === "h4") {
      currentSection = normalizeText($(el).text()).replace(/[–—-]\s*$/, "").trim() || currentSection;
      return;
    }

    $(el)
      .find("li")
      .each((__, li) => {
        const strong = normalizeText($(li).find("strong, b").first().text());
        const text = normalizeText($(li).text());
        if (text.length < 5) return;

        if (strong) {
          const title = strong.replace(/\s*[-–—]\s*$/, "").trim();
          let body = text;
          if (body.startsWith(title)) body = normalizeText(body.slice(title.length).replace(/^[-–—]\s*/, ""));
          opportunities.push({ category: currentSection, title, description: body || text });
        } else {
          opportunities.push({ category: currentSection, title: text, description: text });
        }
      });
  });

  return opportunities;
}

function parseColumnCardOpportunities($, tab) {
  const opportunities = [];

  tab.find(".colmn-wrap .policydata, .policydata").each((i, el) => {
    const text = normalizeText($(el).text());
    if (text.length < 20) return;
    opportunities.push({
      category: "Key Investment Opportunities",
      title: `Opportunity ${i + 1}`,
      description: text,
    });
  });

  return opportunities;
}

function parseTwoColumnCardOpportunities($, tab) {
  const opportunities = [];

  tab.find(".newpolicy, .newpolicy1, .col-md-6").each((_, col) => {
    const sectionTitle = normalizeText($(col).find("h3").first().text()) || "Key Investment Opportunities";
    $(col)
      .find("ul.bullets li, ul.bullets1 li, ul.bullets3 li")
      .each((__, li) => {
        const text = normalizeText($(li).text());
        if (text.length < 8) return;
        opportunities.push({ category: sectionTitle, title: text.slice(0, 80), description: text });
      });
  });

  return opportunities;
}

function detectOpportunityFormat($, tab) {
  if (tab.find(".flip-items .fliper-div, .fliper-div").length > 0) return "carousel";
  if (tab.find(".colmn-wrap .policydata").length >= 2) return "columns";
  if (tab.find(".newpolicy, .newpolicy1").length > 0) return "two-column";
  if (tab.find("ul.bullets li, ul.bullets1 li").length > 0) return "bullets";
  if (/content will be available soon/i.test(tab.text())) return "placeholder";
  return "unknown";
}

function parseInvestmentOpportunities(html) {
  const $ = cheerio.load(html);
  const tab = $("#tab5");
  if (!tab.length) return { opportunities: [], format: "missing" };

  const format = detectOpportunityFormat($, tab);
  let opportunities = [];

  switch (format) {
    case "carousel":
      opportunities = parseCarouselOpportunities($, tab);
      break;
    case "bullets":
      opportunities = parseBulletListOpportunities($, tab);
      break;
    case "columns":
      opportunities = parseColumnCardOpportunities($, tab);
      break;
    case "two-column":
      opportunities = parseTwoColumnCardOpportunities($, tab);
      break;
    case "placeholder":
      opportunities = [
        {
          category: "Status",
          title: "Coming soon",
          description: "Official Invest UP content for this section is not yet published on the portal.",
        },
      ];
      break;
    default:
      opportunities = [
        ...parseCarouselOpportunities($, tab),
        ...parseBulletListOpportunities($, tab),
        ...parseColumnCardOpportunities($, tab),
        ...parseTwoColumnCardOpportunities($, tab),
      ];
  }

  return { opportunities: dedupeOpportunities(opportunities), format };
}

function resolveCountDisplay($, countEl) {
  const dataCount = countEl.attr("data-count");
  const parent = countEl.closest("b, strong");
  if (dataCount != null && dataCount !== "" && parent.length) {
    const clone = parent.clone();
    clone.find("text.count, .count").text(dataCount);
    return normalizeText(clone.text());
  }
  const text = normalizeText(countEl.text());
  return text && text !== "0" ? text : "";
}

function parseOverviewStats($, tab) {
  const stats = [];
  const seen = new Set();

  tab.find(".fdi-flow #counter li, .fdi-flow > ul > li, .noida-services li, .noida-services1 li, .noida-services3 li").each((_, el) => {
    const $li = $(el);

    const $countWithData = $li.find("text.count[data-count], .count[data-count]").first();
    if ($countWithData.length && $li.find("span").length && !$li.find("a.local").length) {
      const value = resolveCountDisplay($, $countWithData);
      const label = normalizeText($li.find("span").text());
      const key = `${value}|${label}`;
      if (value && label.length > 3 && !seen.has(key)) {
        seen.add(key);
        stats.push({ value, label });
      }
      return;
    }

    const $local = $li.find("a.local");
    if ($local.length) {
      const $strong = $local.find("strong").first();
      const $countEl = $strong.find("text.count, .count").first();
      let value = "";
      let label = normalizeText($local.text());

      if ($countEl.length) {
        const dataCount = $countEl.attr("data-count");
        if (dataCount != null && dataCount !== "") {
          value = resolveCountDisplay($, $countEl);
          label = normalizeText($local.text().replace(normalizeText($strong.text()), ""));
        } else {
          const countText = normalizeText($countEl.text());
          const remainder = normalizeText(label.replace(countText, ""));
          const metric = remainder.match(/^[\d.,]+%?|\$[\d.]+ ?[BMKbn]+/i)?.[0];
          if (metric) {
            value = metric;
            label = countText ? `${countText} — ${remainder}` : remainder;
          } else {
            value = countText;
            label = remainder || countText;
          }
        }
      }

      const key = `${value}|${label}`;
      if (value && label.length > 3 && !seen.has(key)) {
        seen.add(key);
        stats.push({ value, label });
      }
    }
  });

  return stats;
}

function parseSectorContacts(html) {
  const $ = cheerio.load(html);
  const contacts = [];

  $(".sector_expert .expertbox, li.expertbox").each((_, box) => {
    const $box = $(box);
    const name = normalizeText($box.find("h4").first().text());
    if (!name || /comment|<!--/.test(name)) return;

    const emailRaw = normalizeText($box.find("p.mail_1").text());
    const emailMatch = emailRaw.match(/[\w.+-]+@[\w.-]+\.\w+/);

    contacts.push({
      name,
      department: normalizeText($box.find("p.title").first().text()),
      designation: normalizeText($box.find("p.title1").first().text()),
      phone: normalizeText($box.find("p.call_1").text()).replace(/^.*?\)/, "").trim() || normalizeText($box.find("p.call_1").text()),
      email: emailMatch ? emailMatch[0] : "",
    });
  });

  return contacts;
}

function sectionKey(heading) {
  const h = heading.toUpperCase();
  if (h.includes("INDIA") && h.includes("SCENARIO")) return "indiaScenario";
  if (h.includes("UTTAR PRADESH")) return "upScenario";
  if (h.includes("ECOSYSTEM")) return "ecosystemSupport";
  if (h.includes("ADVANTAGE")) return "advantageUp";
  return null;
}

function parseIndustryOverview(html) {
  const $ = cheerio.load(html);
  const tab = $("#tab1");
  if (!tab.length) return null;

  const indiaScenario = [];
  const upScenario = [];
  const otherSections = [];

  tab.find("h3, h2.gradient-head").each((_, heading) => {
    const headingText = normalizeText($(heading).text());
    const key = sectionKey(headingText);
    const bullets = [];

    let el = $(heading).next();
    while (el.length && !el.is("h3") && !el.is("h2")) {
      if (el.is("ul")) {
        el.find("li").each((__, li) => {
          const text = normalizeText($(li).text());
          if (text.length > 10) bullets.push(text);
        });
      }
      if (el.is("div") || el.is("section")) {
        el.find("> ul li, ul.bullets li, ul.bullets1 li").each((__, li) => {
          const text = normalizeText($(li).text());
          if (text.length > 10 && !bullets.includes(text)) bullets.push(text);
        });
      }
      el = el.next();
    }

    if (!bullets.length) return;

    if (key === "indiaScenario") indiaScenario.push(...bullets);
    else if (key === "upScenario") upScenario.push(...bullets);
    else if (key) otherSections.push({ heading: headingText, bullets });
    else if (/scenario|overview|advantage|ecosystem|support|opportunit/i.test(headingText)) {
      otherSections.push({ heading: headingText, bullets });
    }
  });

  const highlights = [];
  tab.find(".indiansenior .is_text, .is_text").each((_, el) => {
    const text = normalizeText($(el).text());
    if (text && text.length > 8 && !highlights.some((h) => h.label === text)) {
      highlights.push({ label: text });
    }
  });

  const stats = parseOverviewStats($, tab);

  if (!indiaScenario.length && !upScenario.length && !highlights.length && !stats.length && !otherSections.length) {
    return null;
  }

  return { indiaScenario, upScenario, otherSections, highlights, stats };
}

function parseAiCityPage(html) {
  const $ = cheerio.load(html);
  const invest = $(".invest-project");
  if (!invest.length) return null;

  const projectName = normalizeText($(".projectname").clone().children("span").remove().end().text());
  const acreage = normalizeText($(".projectname span").text());
  const summary = normalizeText(invest.find(".col-md-12 > p").first().text());

  const vision = [];
  invest.find(".c-facilities").first().find("ul.ai-points li").each((_, li) => {
    const text = normalizeText($(li).text());
    if (text) vision.push(text);
  });

  const infrastructure = [];
  invest.find("ul.check li").each((_, li) => {
    const text = normalizeText($(li).text());
    if (text) infrastructure.push(text);
  });

  const components = [];
  invest.find(".c-facilities").each((_, section) => {
    const heading = normalizeText($(section).find("h3").text());
    if (heading !== "Components") return;
    $(section)
      .find("ul.ai-points li")
      .each((__, li) => {
        const text = normalizeText($(li).text());
        if (text) components.push({ category: "Components", title: text, description: text });
      });
  });

  const stats = [];
  const statSeen = new Set();
  function addStat(value, label) {
    const key = `${value}|${label.slice(0, 40)}`;
    if (!value || !label || statSeen.has(key)) return;
    statSeen.add(key);
    stats.push({ value, label });
  }

  if (acreage) addStat(acreage, projectName || "AI City Lucknow");
  for (const bullet of infrastructure) {
    const acres = bullet.match(/(\d+[\d.]*\+?\s*Acres)/i);
    const far = bullet.match(/FAR\s+(\d+\s*Max\.?)/i);
    const power = bullet.match(/(400\s*KV[^|]*)/i);
    if (acres) addStat(acres[1], bullet.slice(0, 90));
    else if (far) addStat(`FAR ${far[1]}`, "Floor Area Ratio allowance");
    else if (power) addStat("400 KV", "Power supply to grid stations");
  }

  return {
    id: "ai-city",
    slug: "ai-city",
    name: "AI City",
    url: "https://invest.up.gov.in/ai-city/",
    sourceUrl: "https://invest.up.gov.in/ai-city/",
    liveOnSite: true,
    isSpecialProject: true,
    investmentSignal: "high",
    investmentScore: 96,
    policy: "UP Information Technology Policy 2017",
    districtHotspots: ["Lucknow"],
    industryOverview: {
      indiaScenario: summary ? [summary] : [],
      upScenario: infrastructure,
      highlights: vision.map((label) => ({ label })),
      stats,
      otherSections: vision.length ? [{ heading: "Vision", bullets: vision }] : [],
    },
    investmentOpportunities: components,
    opportunityFormat: "ai-city",
    contacts: parseSectorContacts(html),
    detailScraped: true,
  };
}

module.exports = {
  parseIndustryOverview,
  parseInvestmentOpportunities,
  parseSectorContacts,
  parseAiCityPage,
  detectOpportunityFormat,
  normalizeText,
};
