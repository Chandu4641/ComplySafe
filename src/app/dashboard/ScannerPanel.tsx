"use client";

import { useState } from "react";

export default function ScannerPanel() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [crawlDepth, setCrawlDepth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; level: string; findings: number; crawledUrls?: string[]; scanId?: string } | null>(null);
  const [error, setError] = useState("");

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    if (url) form.append("url", url);
    if (file) form.append("file", file);
    form.append("crawlDepth", String(crawlDepth));

    const res = await fetch("/api/scanner/run", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error ?? "Scan failed");
      setLoading(false);
      return;
    }

    setResult({ score: data.riskScore, level: data.riskLevel, findings: data.findings, crawledUrls: data.crawledUrls, scanId: data.scanId });
    setLoading(false);
  }

  return (
    <div className="panel">
      <h2>Compliance Risk Scanner</h2>
      <p className="muted">Upload a document or enter a URL to get a risk score.</p>
      <form onSubmit={runScan} className="scan-form">
        <label className="muted">URL (optional)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/policy"
        />
        <label className="muted">Crawl Depth (0-3)</label>
        <input
          type="number"
          min={0}
          max={3}
          value={crawlDepth}
          onChange={(e) => setCrawlDepth(Number(e.target.value))}
        />
        <label className="muted">Document (optional)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="cta" disabled={loading}>
          {loading ? "Scanning..." : "Run Scan"}
        </button>
      </form>
      {error && <div style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>}
      {result && (
        <div className="scan-result">
          <div>
            <div className="muted">Risk Score</div>
            <strong>{result.score}</strong>
          </div>
          <div>
            <div className="muted">Risk Level</div>
            <strong>{result.level}</strong>
          </div>
          <div>
            <div className="muted">Findings</div>
            <strong>{result.findings}</strong>
          </div>
        </div>
      )}
      {result?.crawledUrls && result.crawledUrls.length > 0 && (
        <div className="scan-crawl">
          <div className="muted">Crawled URLs</div>
          <ul>
            {result.crawledUrls.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>
      )}
      {result?.scanId && (
        <div style={{ marginTop: 12 }}>
          <a className="cta secondary" href={`/api/scanner/report/pdf?scanId=${result.scanId}`}>
            Download Scan PDF
          </a>
        </div>
      )}
    </div>
  );
}
