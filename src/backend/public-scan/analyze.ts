export type ScanInput = {
  companyName: string;
  website: string;
  country?: string;
  industry?: string;
  targetCustomers: "India" | "EU" | "US" | "Global";
};

type Page = {
  url: string;
  html: string;
  text: string;
};

const PRIORITY_PATHS = [
  "/privacy-policy",
  "/privacy",
  "/terms",
  "/cookie-policy",
  "/cookies",
  "/data-protection",
  "/legal",
  "/contact",
  "/about"
];

const GDPR_KEYWORDS = [
  "gdpr",
  "data controller",
  "data processor",
  "lawful basis",
  "data subject",
  "right to access",
  "right to erasure",
  "right to rectification"
];

const DPDP_KEYWORDS = [
  "dpdp",
  "data fiduciary",
  "consent manager",
  "grievance",
  "withdraw consent"
];

const HIPAA_KEYWORDS = [
  "hipaa",
  "phi",
  "protected health information",
  "notice of privacy practices",
  "health information"
];

const RIGHTS_KEYWORDS = [
  "access",
  "delete",
  "erasure",
  "rectification",
  "correction",
  "withdraw consent",
  "opt out"
];

const PURPOSE_KEYWORDS = [
  "purpose",
  "processing",
  "use of data",
  "use your information"
];

const DATA_CATEGORY_KEYWORDS = [
  "personal data",
  "personal information",
  "email",
  "phone",
  "address",
  "ip address"
];

const RETENTION_KEYWORDS = [
  "retention",
  "retain",
  "storage period",
  "kept for"
];

const SECURITY_KEYWORDS = [
  "security",
  "encryption",
  "safeguards",
  "access controls",
  "breach"
];

const THIRD_PARTY_KEYWORDS = [
  "service providers",
  "third parties",
  "shared with",
  "processors"
];

const COOKIE_KEYWORDS = [
  "cookie",
  "consent",
  "preferences",
  "opt out"
];

const TRACKER_KEYWORDS = [
  "google-analytics",
  "gtag",
  "facebook",
  "fbq",
  "segment",
  "hotjar",
  "mixpanel"
];

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(html: string, baseUrl: string) {
  const urls: string[] = [];
  const base = new URL(baseUrl);
  const regex = /href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    try {
      const url = new URL(match[1], base);
      if (url.origin === base.origin) {
        urls.push(url.toString());
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return Array.from(new Set(urls));
}

function extractFooterLinks(html: string, baseUrl: string) {
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (!footerMatch) return [];
  return extractLinks(footerMatch[0], baseUrl);
}

function findLastUpdated(text: string) {
  const match = text.match(/last updated[:\s]+([a-zA-Z]+\s+\d{1,2},\s+\d{4})/i);
  return match ? match[1] : "";
}

function hasAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function countAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.reduce((acc, k) => (lower.includes(k) ? acc + 1 : acc), 0);
}

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}

async function fetchRobots(baseUrl: string) {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).toString();
    const text = await fetchText(robotsUrl);
    return text;
  } catch {
    return "";
  }
}

function isDisallowed(robots: string, path: string) {
  const lines = robots.split("\n").map((l) => l.trim());
  const disallow = lines
    .filter((l) => l.toLowerCase().startsWith("disallow:"))
    .map((l) => l.split(":")[1]?.trim() ?? "")
    .filter(Boolean);
  return disallow.some((d) => path.startsWith(d));
}

async function fetchPage(url: string): Promise<Page | null> {
  try {
    const html = await fetchText(url);
    return { url, html, text: stripHtml(html) };
  } catch {
    return null;
  }
}

import { FRAMEWORKS, RULESETS, FrameworkKey, Rule } from "./rulesets";

type FrameworkReport = {
  framework: FrameworkKey;
  score: number;
  risk_level: string;
  checklist: {
    id: string;
    title: string;
    requirement: string;
    status: "pass" | "fail";
    severity: string;
    evidence: string[];
    remediation: string;
    sources: { title: string; url: string }[];
  }[];
};

function buildChecklist(rules: Rule[], pages: Page[], allText: string) {
  return rules.map((rule) => {
    const evidence: string[] = [];
    if (rule.pageHints) {
      rule.pageHints.forEach((hint) => {
        if (pages.some((p) => p.url.toLowerCase().includes(hint))) {
          evidence.push(`page:${hint}`);
        }
      });
    }
    if (rule.keywords) {
      rule.keywords.forEach((k) => {
        if (allText.toLowerCase().includes(k.toLowerCase())) {
          evidence.push(`keyword:${k}`);
        }
      });
    }
    const status: "pass" | "fail" = evidence.length > 0 ? "pass" : "fail";
    return {
      id: rule.id,
      title: rule.title,
      requirement: rule.requirement,
      status,
      severity: rule.severity,
      evidence,
      remediation: rule.remediation,
      sources: rule.sources
    };
  });
}

export async function runPublicScan(
  input: ScanInput & {
    framework?: FrameworkKey;
    frameworks?: FrameworkKey[];
    applyAll?: boolean;
  }
) {
  const website = input.website.trim();
  const base = new URL(website);
  const robots = await fetchRobots(base.toString());

  const pages: Page[] = [];
  const homepage = await fetchPage(base.toString());
  if (homepage) pages.push(homepage);

  const footerLinks = homepage ? extractFooterLinks(homepage.html, base.toString()) : [];
  const priorityLinks = PRIORITY_PATHS.map((p) => new URL(p, base).toString());
  const combined = Array.from(new Set([...footerLinks, ...priorityLinks]));

  for (const link of combined) {
    const path = new URL(link).pathname;
    if (robots && isDisallowed(robots, path)) continue;
    if (pages.some((p) => p.url === link)) continue;
    const page = await fetchPage(link);
    if (page) pages.push(page);
  }

  const allText = pages.map((p) => p.text).join(" ");
  const allHtml = pages.map((p) => p.html).join(" ");

  const https = base.protocol === "https:";
  const hasForms = allHtml.toLowerCase().includes("<form");
  const hasCookieSignals = hasAny(allText, COOKIE_KEYWORDS);
  const hasTrackers = hasAny(allHtml, TRACKER_KEYWORDS);
  const lastUpdated = findLastUpdated(allText);

  const privacyExists = pages.some((p) => p.url.includes("privacy"));
  const termsExists = pages.some((p) => p.url.includes("terms"));

  const transparencySignals = [
    privacyExists ? "Privacy policy accessible" : "",
    countAny(allText, DATA_CATEGORY_KEYWORDS) > 0 ? "Data categories mentioned" : "",
    countAny(allText, PURPOSE_KEYWORDS) > 0 ? "Purpose of processing described" : "",
    countAny(allText, THIRD_PARTY_KEYWORDS) > 0 ? "Third-party sharing disclosure" : "",
    countAny(allText, RETENTION_KEYWORDS) > 0 ? "Retention language present" : ""
  ].filter(Boolean);

  const consentSignals = [
    hasCookieSignals ? "Cookie/consent language present" : "",
    countAny(allText, RIGHTS_KEYWORDS) >= 2 ? "User rights mentioned" : ""
  ].filter(Boolean);

  const jurisdictionSignals = [
    hasAny(allText, GDPR_KEYWORDS) ? "GDPR references found" : "",
    hasAny(allText, DPDP_KEYWORDS) ? "DPDP references found" : "",
    hasAny(allText, HIPAA_KEYWORDS) ? "HIPAA references found" : ""
  ].filter(Boolean);

  const securitySignals = [
    https ? "HTTPS enabled" : "",
    hasAny(allText, SECURITY_KEYWORDS) ? "Security language present" : ""
  ].filter(Boolean);

  const remediationMap = [
    {
      trigger: () => !privacyExists,
      text: "Publish a clear, accessible privacy policy linked in the footer."
    },
    {
      trigger: () => !hasCookieSignals,
      text: "Implement a cookie consent banner with opt-in/opt-out controls for non-essential cookies."
    },
    {
      trigger: () => countAny(allText, RETENTION_KEYWORDS) === 0,
      text: "Add data retention periods (or criteria by data category) to the privacy notice."
    },
    {
      trigger: () => countAny(allText, RIGHTS_KEYWORDS) < 2,
      text: "Describe user rights clearly (access, deletion, correction, withdrawal) and how to exercise them."
    },
    {
      trigger: () => countAny(allText, PURPOSE_KEYWORDS) === 0,
      text: "Explain the purposes and legal basis for data processing."
    },
    {
      trigger: () => !https,
      text: "Enforce HTTPS across the site and redirect HTTP traffic."
    }
  ];

  function buildRationale(missing: string[], positives: string[]) {
    const parts = [];
    if (missing.length > 0) parts.push(`Key gaps: ${missing.join("; ")}`);
    if (positives.length > 0) parts.push(`Positive signals: ${positives.join("; ")}`);
    return parts.join(" | ");
  }

  const baseScore = (countAny(allText, RIGHTS_KEYWORDS) +
    countAny(allText, DATA_CATEGORY_KEYWORDS) +
    countAny(allText, PURPOSE_KEYWORDS) +
    countAny(allText, RETENTION_KEYWORDS) +
    countAny(allText, SECURITY_KEYWORDS)) * 8;

  const gdprApplicable = input.targetCustomers === "EU" || input.targetCustomers === "Global";
  const dpdpApplicable = input.targetCustomers === "India" || input.country?.toLowerCase() === "india";
  const hipaaApplicable = hasAny(allText, HIPAA_KEYWORDS);

  const allFrameworks = FRAMEWORKS.map((f) => f.key);
  const frameworksApplied =
    input.applyAll
      ? allFrameworks
      : input.frameworks && input.frameworks.length > 0
      ? input.frameworks
      : input.framework
      ? [input.framework]
      : [allFrameworks[0]];

  const frameworkReports: FrameworkReport[] = frameworksApplied.map((key) => {
    const rules = RULESETS[key] ?? [];
    const checklist = buildChecklist(rules, pages, allText);
    const weightedTotal = rules.reduce((acc, r) => acc + (r.severity === "High" ? 3 : r.severity === "Medium" ? 2 : 1), 0);
    const weightedPass = checklist.reduce((acc, c) => {
      if (c.status !== "pass") return acc;
      const rule = rules.find((r) => r.id === c.id);
      if (!rule) return acc;
      return acc + (rule.severity === "High" ? 3 : rule.severity === "Medium" ? 2 : 1);
    }, 0);
    const score = weightedTotal === 0 ? 0 : Math.round((weightedPass / weightedTotal) * 100);
    const risk_level = score >= 80 ? "Low Risk" : score >= 50 ? "Medium Risk" : "High Risk";
    return { framework: key, score, risk_level, checklist };
  });

  const primary = frameworkReports[0];

  const gdprScore = Math.min(100, baseScore + (hasAny(allText, GDPR_KEYWORDS) ? 10 : 0));
  const dpdpScore = Math.min(100, baseScore + (hasAny(allText, DPDP_KEYWORDS) ? 10 : 0));
  const hipaaScore = hipaaApplicable ? Math.min(100, baseScore + 5) : 30;

  const confidence =
    pages.length >= 5 ? "High" : pages.length >= 3 ? "Medium" : "Low";

  const riskLevel = (score: number) =>
    score >= 80 ? "Low Risk" : score >= 50 ? "Medium Risk" : "High Risk";

  return {
    company_name: input.companyName,
    website: input.website,
    scan_date: new Date().toISOString().slice(0, 10),
    scan_scope: "Public website only",
    disclaimer:
      "This assessment is based solely on publicly available information and does not constitute legal advice or certification.",
    frameworks_applied: frameworksApplied,
    framework: primary?.framework ?? frameworksApplied[0],
    checklist: primary?.checklist ?? [],
    gdpr: {
      applicable: gdprApplicable,
      score: gdprScore,
      risk_level: riskLevel(gdprScore),
      confidence,
      positive_signals: transparencySignals.concat(consentSignals).concat(jurisdictionSignals.filter((s) => s.includes("GDPR"))),
      missing_or_weak_signals: [
        privacyExists ? "" : "Privacy policy not found in scanned pages",
        hasCookieSignals ? "" : "No clear cookie consent signal observed",
        countAny(allText, RETENTION_KEYWORDS) > 0 ? "" : "Retention details missing or vague"
      ].filter(Boolean),
      key_findings: [
        termsExists ? "Terms page present" : "Terms page not found in scanned pages",
        lastUpdated ? `Last updated reference found: ${lastUpdated}` : "No last-updated date detected"
      ],
      rationale: buildRationale(
        [
          privacyExists ? "" : "privacy policy missing",
          hasCookieSignals ? "" : "cookie consent unclear",
          countAny(allText, RETENTION_KEYWORDS) > 0 ? "" : "retention details missing"
        ].filter(Boolean),
        transparencySignals
      ),
      remediation: remediationMap.filter((r) => r.trigger()).map((r) => r.text)
    },
    dpdp_india: {
      applicable: dpdpApplicable,
      score: dpdpScore,
      risk_level: riskLevel(dpdpScore),
      confidence,
      positive_signals: transparencySignals.concat(consentSignals).concat(jurisdictionSignals.filter((s) => s.includes("DPDP"))),
      missing_or_weak_signals: [
        hasAny(allText, DPDP_KEYWORDS) ? "" : "No explicit DPDP references found",
        hasCookieSignals ? "" : "No clear consent banner signal observed",
        countAny(allText, RETENTION_KEYWORDS) > 0 ? "" : "Retention details missing or vague"
      ].filter(Boolean),
      key_findings: [
        hasForms ? "Forms detected on public pages" : "No forms detected on public pages",
        lastUpdated ? `Last updated reference found: ${lastUpdated}` : "No last-updated date detected"
      ],
      rationale: buildRationale(
        [
          hasAny(allText, DPDP_KEYWORDS) ? "" : "no DPDP references",
          hasCookieSignals ? "" : "consent signal unclear",
          countAny(allText, RETENTION_KEYWORDS) > 0 ? "" : "retention details missing"
        ].filter(Boolean),
        transparencySignals
      ),
      remediation: remediationMap.filter((r) => r.trigger()).map((r) => r.text)
    },
    hipaa: {
      applicable: hipaaApplicable,
      score: hipaaScore,
      risk_level: riskLevel(hipaaScore),
      confidence,
      reason_if_not_applicable: hipaaApplicable ? "" : "No public healthcare/PHI signals detected.",
      positive_signals: jurisdictionSignals.filter((s) => s.includes("HIPAA")),
      missing_or_weak_signals: hipaaApplicable
        ? ["HIPAA notice not clearly detected on public pages"]
        : ["HIPAA not indicated on public pages"],
      key_findings: [
        hasAny(allText, HIPAA_KEYWORDS)
          ? "Healthcare-related language detected on public pages"
          : "No healthcare-specific language detected"
      ],
      rationale: hipaaApplicable
        ? "Healthcare signals detected but HIPAA notice not found publicly."
        : "No public healthcare/PHI indicators; HIPAA likely not applicable.",
      remediation: hipaaApplicable
        ? ["Publish a HIPAA Notice of Privacy Practices if PHI is handled."]
        : []
    },
    overall_observations: [
      https ? "HTTPS is enabled." : "HTTPS is not enabled.",
      hasTrackers ? "Third-party tracking scripts likely present." : "No obvious third-party trackers detected.",
      `Pages scanned: ${pages.length}`
    ],
    recommended_next_steps: [
      "Publish explicit retention periods by data category.",
      "Provide clear cookie consent controls if non-essential cookies are used.",
      "Add jurisdiction-specific privacy contacts and grievance details where applicable."
    ],
    framework_summary: primary
      ? {
          framework: primary.framework,
          score: primary.score,
          risk_level: primary.risk_level,
          passed: primary.checklist.filter((c) => c.status === "pass").length,
          total: primary.checklist.length
        }
      : undefined,
    framework_reports: frameworkReports
  };
}
