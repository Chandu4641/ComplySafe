"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingForm({
  orgId,
  orgName
}: {
  orgId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [framework, setFramework] = useState("GDPR");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, industry, region, frameworksEnabled: framework })
    });
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <h2>Finish Setup</h2>
      <p className="muted">Workspace: {orgName}</p>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Industry</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="SaaS, FinTech, Healthcare..."
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Region</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="US, EU, APAC..."
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Framework</label>
        <select
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
        >
          <option value="GDPR">GDPR</option>
          <option value="DPDP">DPDP</option>
          <option value="ISO27001">ISO 27001</option>
          <option value="PCI_DSS">PCI DSS</option>
          <option value="HIPAA">HIPAA</option>
        </select>
      </div>
      <button className="cta" style={{ marginTop: 18 }} disabled={loading}>
        {loading ? "Saving..." : "Continue to Dashboard"}
      </button>
    </form>
  );
}
