"use client";

import { useState, useEffect, useCallback } from "react";

interface RegulatoryChange {
  id: string;
  framework: string;
  jurisdiction: string;
  title: string;
  description: string;
  effectiveDate: string;
  impactLevel: string;
  sourceUrl: string;
  changes: string[];
}

export default function RegulatoryPage() {
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<RegulatoryChange[]>([]);
  const [filterFramework, setFilterFramework] = useState<string>("all");
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchChanges = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterFramework !== "all") params.set("framework", filterFramework);
      if (filterJurisdiction !== "all") params.set("jurisdiction", filterJurisdiction);
      
      const res = await fetch(`/api/regulatory/changes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setChanges(data.report?.changes ?? data.changes ?? []);
      } else {
        setError("Failed to load regulatory changes. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch regulatory changes:", err);
      setError("Failed to load regulatory changes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterFramework, filterJurisdiction]);

  // Initial mount
  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  async function handleSync() {
    setError(null);
    try {
      setSyncing(true);
      const res = await fetch("/api/regulatory/changes", { method: "POST" });
      if (res.ok) {
        await fetchChanges();
      } else {
        setError("Failed to sync regulatory feed. Please try again.");
      }
    } catch (err) {
      console.error("Failed to sync regulatory feed:", err);
      setError("Failed to sync regulatory feed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  const getImpactColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#22c55e";
      default: return "#6b7280";
    }
  };

  const frameworks = [...new Set(changes.map(c => c.framework))];
  const jurisdictions = [...new Set(changes.map(c => c.jurisdiction))];

  if (loading && changes.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">Loading regulatory changes...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Regulatory Intelligence</h1>
          <p className="subtitle">Stay updated with regulatory changes affecting your compliance</p>
        </div>
        <button 
          className="sync-button" 
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "🔄 Sync Updates"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label>Framework:</label>
          <select 
            value={filterFramework} 
            onChange={(e) => setFilterFramework(e.target.value)}
          >
            <option value="all">All Frameworks</option>
            {frameworks.map(fw => (
              <option key={fw} value={fw}>{fw}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Jurisdiction:</label>
          <select 
            value={filterJurisdiction} 
            onChange={(e) => setFilterJurisdiction(e.target.value)}
          >
            <option value="all">All Jurisdictions</option>
            {jurisdictions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>

      {changes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Regulatory Changes</h3>
          <p>No regulatory changes found for your selected filters.</p>
        </div>
      ) : (
        <div className="changes-list">
          {changes.map((change) => (
            <div key={change.id} className="change-card">
              <div className="change-header">
                <div className="change-meta">
                  <span className="framework-badge">{change.framework}</span>
                  <span className="jurisdiction-badge">{change.jurisdiction}</span>
                  <span 
                    className="impact-badge"
                    style={{ backgroundColor: getImpactColor(change.impactLevel) }}
                  >
                    {change.impactLevel} Impact
                  </span>
                </div>
                <div className="effective-date">
                  Effective: {change.effectiveDate ? new Date(change.effectiveDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <h3 className="change-title">{change.title}</h3>
              <p className="change-description">{change.description}</p>
              
              {change.changes && change.changes.length > 0 && (
                <div className="changes-detail">
                  <h4>Key Changes:</h4>
                  <ul>
                    {change.changes.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {change.sourceUrl && (
                <a 
                  href={change.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  📄 View Source →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        .subtitle {
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        .sync-button {
          padding: 10px 20px;
          background: #0f7f8a;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        .sync-button:hover:not(:disabled) {
          background: #0d6b73;
        }
        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-banner {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-group label {
          font-weight: 500;
          color: #374151;
        }
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          min-width: 150px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
          border-radius: 12px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #374151;
        }
        .empty-state p {
          color: #6b7280;
          margin: 0;
        }
        .changes-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .change-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: box-shadow 0.2s;
        }
        .change-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .change-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .change-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .framework-badge, .jurisdiction-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .framework-badge {
          background: #e0f2fe;
          color: #0369a1;
        }
        .jurisdiction-badge {
          background: #f3e8ff;
          color: #7c3aed;
        }
        .impact-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        .effective-date {
          font-size: 13px;
          color: #6b7280;
        }
        .change-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }
        .change-description {
          color: #4b5563;
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
        .changes-detail {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .changes-detail h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #374151;
        }
        .changes-detail ul {
          margin: 0;
          padding-left: 20px;
        }
        .changes-detail li {
          color: #4b5563;
          margin-bottom: 4px;
        }
        .source-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #0f7f8a;
          text-decoration: none;
          font-weight: 500;
        }
        .source-link:hover {
          text-decoration: underline;
        }
        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
