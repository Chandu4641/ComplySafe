"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Integration {
  id: string;
  type: string;
  provider: string;
  status: string;
  lastSync?: string;
}

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

const integrationDefs: IntegrationDef[] = [
  {
    id: "AWS",
    name: "AWS Security Hub",
    description: "Aggregate and prioritize security alerts",
    icon: "☁️",
    category: "Cloud Security",
  },
  {
    id: "AZURE",
    name: "Azure Security Center",
    description: "Unified security management",
    icon: "🔷",
    category: "Cloud Security",
  },
  {
    id: "GITHUB",
    name: "GitHub",
    description: "Code security and compliance scanning",
    icon: "🐙",
    category: "Development",
  },
  {
    id: "OKTA",
    name: "Okta",
    description: "Identity and access management",
    icon: "🔐",
    category: "Identity",
  },
  {
    id: "GOOGLE_WORKSPACE",
    name: "Google Workspace",
    description: "Workspace security and compliance",
    icon: "📧",
    category: "Identity",
  },
  {
    id: "SNYK",
    name: "Snyk",
    description: "Vulnerability detection and remediation",
    icon: "🛡️",
    category: "Security",
  },
  {
    id: "WIZ",
    name: "Wiz",
    description: "Cloud security posture management",
    icon: "🔍",
    category: "Security",
  },
  {
    id: "CROWDSTRIKE",
    name: "CrowdStrike",
    description: "Endpoint protection and threat detection",
    icon: "🛡️",
    category: "Security",
  },
  {
    id: "MICROSOFT_TEAMS",
    name: "Microsoft Teams",
    description: "Compliance notifications and collaboration",
    icon: "💬",
    category: "Communication",
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const res = await fetch("/api/integrations");
        if (!res.ok) {
          throw new Error(`Failed to fetch integrations: ${res.status}`);
        }
        const data = await res.json();
        setIntegrations(data.integrations || []);
      } catch (err) {
        setError("Failed to load integrations");
      } finally {
        setLoading(false);
      }
    }
    fetchIntegrations();
  }, []);

  const getIntegrationStatus = (type: string): Integration | undefined => {
    return integrations.find(
      (i) => i.type.toUpperCase() === type || i.provider?.toUpperCase() === type
    );
  };

  const handleConnect = async (type: string) => {
    setConnecting(type);
    setError("");

    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to connect");
      }

      // Refresh integrations list
      const refreshRes = await fetch("/api/integrations");
      const refreshData = await refreshRes.json();
      setIntegrations(refreshData.integrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setConnecting(null);
    }
  };

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  const groupedIntegrations = integrationDefs.reduce((acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, IntegrationDef[]>);

  if (loading) {
    return (
      <div className="integrations-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-page">
      <div className="page-header">
        <h2>Connect Integrations</h2>
        <p className="muted">
          Connect your security and compliance tools to automatically sync controls and evidence.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{connectedCount}</span>
          <span className="stat-label">Connected</span>
        </div>
        <div className="stat">
          <span className="stat-value">{integrationDefs.length}</span>
          <span className="stat-label">Available</span>
        </div>
      </div>

      {Object.entries(groupedIntegrations).map(([category, defs]) => (
        <div key={category} className="integration-category">
          <h3>{category}</h3>
          <div className="integration-grid">
            {defs.map((def) => {
              const status = getIntegrationStatus(def.id);
              const isConnected = status?.status === "connected";
              const isConnecting = connecting === def.id;

              return (
                <div
                  key={def.id}
                  className={`integration-card ${isConnected ? "connected" : ""}`}
                >
                  <div className="card-header">
                    <span className="integration-icon">{def.icon}</span>
                    {isConnected && (
                      <span className="status-badge connected">Connected</span>
                    )}
                  </div>
                  <h4>{def.name}</h4>
                  <p className="description">{def.description}</p>
                  {status?.lastSync && (
                    <p className="last-sync">
                      Last synced: {new Date(status.lastSync).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    className={`connect-btn ${isConnected ? "disconnect" : ""}`}
                    onClick={() => !isConnected && handleConnect(def.id)}
                    disabled={isConnecting || isConnected}
                  >
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="actions">
        <button className="cta secondary" onClick={() => router.push("/frameworks")}>
          Back
        </button>
        <button className="cta" onClick={() => router.push("/controls")}>
          Continue to Controls
        </button>
      </div>

      <style jsx>{`
        .integrations-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .page-header h2 {
          margin: 0 0 8px;
          font-size: 24px;
          color: #111827;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 0;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #0f7f8a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .stats-bar {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-bottom: 32px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 12px;
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #0f7f8a;
        }
        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }
        .integration-category {
          margin-bottom: 32px;
        }
        .integration-category h3 {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .integration-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .integration-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        .integration-card:hover {
          border-color: #d1d5db;
        }
        .integration-card.connected {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .integration-icon {
          font-size: 28px;
        }
        .status-badge {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .status-badge.connected {
          background: #22c55e;
          color: white;
        }
        .integration-card h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #111827;
        }
        .description {
          margin: 0 0 12px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }
        .last-sync {
          margin: 0 0 12px;
          font-size: 12px;
          color: #9ca3af;
        }
        .connect-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #0f7f8a;
          color: white;
        }
        .connect-btn:hover:not(:disabled) {
          background: #0d706e;
        }
        .connect-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .connect-btn.disconnect {
          background: transparent;
          border: 1px solid #22c55e;
          color: #22c55e;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .cta {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #0f7f8a;
          color: white;
          border: none;
        }
        .cta:hover {
          background: #0d706e;
        }
        .cta.secondary {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        .cta.secondary:hover {
          background: #f9fafb;
        }
        @media (max-width: 640px) {
          .actions {
            flex-direction: column;
            gap: 12px;
          }
          .cta {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
