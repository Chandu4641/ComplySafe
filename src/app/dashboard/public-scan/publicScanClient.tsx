"use client";

import { useState } from "react";

export default function PublicScanClient() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetCustomers, setTargetCustomers] = useState("Global");
  const [applyAll, setApplyAll] = useState(true);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "running" | "done">("idle");
  const [resultObj, setResultObj] = useState<any | null>(null);
  const [error, setError] = useState("");

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setScanStatus("running");

    const res = await fetch("/api/public-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: companyName,
        website,
        country,
        industry,
        target_customers: targetCustomers,
        frameworks,
        apply_all: applyAll
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Scan failed");
      setLoading(false);
      return;
    }
    setResultObj(data);
    setScanStatus("done");
    setLoading(false);
  }

  async function downloadPdf() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/public-scan/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result: resultObj,
        company_name: companyName,
        website,
        country,
        industry,
        target_customers: targetCustomers,
        frameworks,
        apply_all: applyAll
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "PDF export failed");
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "public-compliance-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div className="panel">
      <h1>Public Website Compliance Scan</h1>
      <p className="muted">
        Provide the inputs and the backend will scan public pages only.
      </p>
      <form onSubmit={runScan} className="scan-form">
        <input
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <input
          placeholder="Website URL"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          required
        />
        <input
          placeholder="Country of Operation (optional)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <input
          placeholder="Industry (optional)"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <select
          value={targetCustomers}
          onChange={(e) => setTargetCustomers(e.target.value)}
        >
          <option value="India">India</option>
          <option value="EU">EU</option>
          <option value="US">US</option>
          <option value="Global">Global</option>
        </select>
        <div className="framework-pills">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={applyAll}
              onChange={(e) => {
                setApplyAll(e.target.checked);
                if (e.target.checked) setFrameworks([]);
              }}
            />
            Apply all regulations
          </label>
          {["GDPR", "DPDP", "PCI_DSS", "ISO_27001", "HIPAA"].map((key) => {
            const active = frameworks.includes(key);
            return (
              <button
                type="button"
                key={key}
                className={`pill ${active ? "ok" : ""}`}
                disabled={applyAll}
                onClick={() => {
                  if (applyAll) return;
                  setFrameworks((prev) =>
                    prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
                  );
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
        <button className="cta" disabled={loading}>
          {loading ? "Scanning..." : "Run Public Scan"}
        </button>
      </form>
      <div style={{ marginTop: 12 }}>
        <button className="cta secondary" onClick={downloadPdf} disabled={loading || !companyName || !website}>
          {loading ? "Preparing PDF..." : "Download PDF Report"}
        </button>
      </div>
      {scanStatus === "done" && !error && (
        <div style={{ marginTop: 12 }} className="muted">
          Scan complete. Download the PDF report for full details.
        </div>
      )}
      {error && <div style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>}
      {/* Raw JSON output removed per requirement */}
    </div>
  );
}
