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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry || !region) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, industry, region })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (res.status === 403) {
          setError("You don't have permission to perform this action.");
        } else {
          setError("Failed to save. Please try again.");
        }
        setLoading(false);
        return;
      }
      
      router.push("/frameworks");
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
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
          required
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Region</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="US, EU, APAC..."
          required
        />
      </div>
      {error ? <p style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p> : null}
      <button className="cta" style={{ marginTop: 18 }} disabled={loading}>
        {loading ? "Saving..." : "Continue to Framework Selection"}
      </button>
    </form>
  );
}
