"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, orgName })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 480 }}>
      <h2>Get Started</h2>
      <p className="muted">Create a workspace and start your compliance program.</p>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Work Email</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Password</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          minLength={8}
          required
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="muted">Company Name</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Acme Inc."
          required
        />
      </div>
      {error && <div style={{ marginTop: 12, color: "var(--danger)" }}>{error}</div>}
      <button className="cta" style={{ marginTop: 18 }} disabled={loading}>
        {loading ? "Creating..." : "Continue"}
      </button>
    </form>
  );
}
