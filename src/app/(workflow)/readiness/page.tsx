"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Stats {
  coverage: number;
  openRisks: number;
  evidence: number;
}

interface Framework {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  score?: number;
}

export default function ReadinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ coverage: 0, openRisks: 0, evidence: 0 });
  const [frameworks, setFrameworks] = useState<Framework[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const [statsRes, frameworksRes] = await Promise.all([
          fetch("/api/dashboard/compliance"),
          fetch("/api/frameworks")
        ]);

        const statsData = await statsRes.json();
        const frameworksData = await frameworksRes.json();

        setStats({
          coverage: statsData.coverage || 0,
          openRisks: statsData.openRisks || 0,
          evidence: statsData.evidence || 0
        });

        setFrameworks(frameworksData.frameworks || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const enabledFrameworks = frameworks.filter(f => f.enabled);
  const overallScore = enabledFrameworks.length > 0
    ? Math.round(enabledFrameworks.reduce((sum, f) => sum + (f.score || 0), 0) / enabledFrameworks.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Audit Ready";
    if (score >= 60) return "In Progress";
    return "Needs Attention";
  };

  if (loading) {
    return (
      <div className="readiness-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="readiness-page">
      <div className="page-header">
        <h2>Compliance Readiness Dashboard</h2>
        <p className="muted">
          Your overall compliance status across all selected frameworks.
        </p>
      </div>

      <div className="hero-score">
        <div className="score-circle" style={{ borderColor: getScoreColor(overallScore) }}>
          <span className="score-value" style={{ color: getScoreColor(overallScore) }}>
            {overallScore}%
          </span>
          <span className="score-label">{getScoreLabel(overallScore)}</span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="value">{stats.coverage}%</span>
            <span className="label">Coverage</span>
          </div>
          <div className="hero-stat">
            <span className="value">{stats.openRisks}</span>
            <span className="label">Open Risks</span>
          </div>
          <div className="hero-stat">
            <span className="value">{stats.evidence}</span>
            <span className="label">Evidence Items</span>
          </div>
        </div>
      </div>

      <div className="frameworks-section">
        <h3>Framework Breakdown</h3>
        {enabledFrameworks.length === 0 ? (
          <div className="empty-state">
            <p>No frameworks enabled. Select a framework to get started.</p>
            <button className="cta" onClick={() => router.push("/frameworks")}>
              Select Framework
            </button>
          </div>
        ) : (
          <div className="framework-list">
            {enabledFrameworks.map((framework) => {
              const score = framework.score || 0;
              return (
                <div key={framework.id} className="framework-item">
                  <div className="framework-info">
                    <span className="framework-name">{framework.name}</span>
                    <span className="framework-key">{framework.key}</span>
                  </div>
                  <div className="framework-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${score}%`,
                          background: getScoreColor(score)
                        }} 
                      />
                    </div>
                    <span className="progress-value" style={{ color: getScoreColor(score) }}>
                      {score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="audit-timeline">
        <h3>Audit Timeline</h3>
        <div className="timeline">
          <div className="timeline-item completed">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-title">Setup Complete</span>
              <span className="timeline-date">Done</span>
            </div>
          </div>
          <div className={`timeline-item ${overallScore >= 60 ? "completed" : ""}`}>
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-title">Control Implementation</span>
              <span className="timeline-date">{overallScore >= 60 ? "In Progress" : "Pending"}</span>
            </div>
          </div>
          <div className={`timeline-item ${overallScore >= 80 ? "completed" : ""}`}>
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-title">Evidence Collection</span>
              <span className="timeline-date">{overallScore >= 80 ? "Ready" : "Pending"}</span>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-title">Audit Readiness</span>
              <span className="timeline-date">{overallScore >= 80 ? "Ready" : "Pending"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="cta secondary" onClick={() => router.push("/evidence")}>
          Back
        </button>
        <button className="cta" onClick={() => router.push("/dashboard")}>
          Go to Main Dashboard
        </button>
      </div>

      <style jsx>{`
        .readiness-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .page-header {
          text-align: center;
          margin-bottom: 32px;
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
        .hero-score {
          display: flex;
          align-items: center;
          gap: 40px;
          padding: 32px;
          background: #f9fafb;
          border-radius: 16px;
          margin-bottom: 32px;
        }
        .score-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 6px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .score-value {
          font-size: 36px;
          font-weight: 700;
        }
        .score-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .hero-stats {
          display: flex;
          gap: 32px;
        }
        .hero-stat {
          text-align: center;
        }
        .hero-stat .value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }
        .hero-stat .label {
          font-size: 13px;
          color: #6b7280;
        }
        .frameworks-section,
        .audit-timeline {
          margin-bottom: 32px;
        }
        .frameworks-section h3,
        .audit-timeline h3 {
          font-size: 16px;
          color: #111827;
          margin: 0 0 16px;
        }
        .empty-state {
          text-align: center;
          padding: 32px;
          background: #f9fafb;
          border-radius: 12px;
        }
        .empty-state p {
          color: #6b7280;
          margin-bottom: 16px;
        }
        .framework-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .framework-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }
        .framework-info {
          display: flex;
          flex-direction: column;
        }
        .framework-name {
          font-weight: 600;
          color: #111827;
        }
        .framework-key {
          font-size: 12px;
          color: #9ca3af;
        }
        .framework-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .progress-bar {
          width: 120px;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .progress-value {
          font-weight: 600;
          font-size: 14px;
          width: 40px;
          text-align: right;
        }
        .timeline {
          position: relative;
          padding-left: 24px;
        }
        .timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
        }
        .timeline-item {
          position: relative;
          padding-bottom: 24px;
          padding-left: 16px;
        }
        .timeline-marker {
          position: absolute;
          left: -20px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e5e7eb;
          border: 2px solid white;
        }
        .timeline-item.completed .timeline-marker {
          background: #22c55e;
        }
        .timeline-content {
          display: flex;
          justify-content: space-between;
        }
        .timeline-title {
          font-weight: 500;
          color: #374151;
        }
        .timeline-date {
          font-size: 14px;
          color: #6b7280;
        }
        .actions {
          display: flex;
          justify-content: space-between;
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
          .hero-score {
            flex-direction: column;
            text-align: center;
          }
          .hero-stats {
            flex-wrap: wrap;
            justify-content: center;
          }
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
