"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Control {
  id: string;
  controlId: string;
  title: string | null;
  description: string;
  category: string | null;
  status: string;
  owner: string | null;
}

type StatusFilter = "all" | "IMPLEMENTED" | "IN_PROGRESS" | "NOT_IMPLEMENTED" | "NOT_APPLICABLE";

const statusLabels: Record<string, string> = {
  IMPLEMENTED: "Implemented",
  IN_PROGRESS: "In Progress",
  NOT_IMPLEMENTED: "Not Implemented",
  PARTIAL: "Partial",
  NOT_APPLICABLE: "N/A",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  IMPLEMENTED: { bg: "#dcfce7", text: "#16a34a" },
  IN_PROGRESS: { bg: "#fef3c7", text: "#d97706" },
  NOT_IMPLEMENTED: { bg: "#fee2e2", text: "#dc2626" },
  PARTIAL: { bg: "#fef3c7", text: "#d97706" },
  NOT_APPLICABLE: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function ControlsPage() {
  const router = useRouter();
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  useEffect(() => {
    async function fetchControls() {
      try {
        const res = await fetch("/api/controls");
        if (!res.ok) {
          throw new Error(`Failed to fetch controls: ${res.status}`);
        }
        const data = await res.json();
        setControls(data.controls || []);
      } catch (err) {
        console.error("Failed to load controls", err);
      } finally {
        setLoading(false);
      }
    }
    fetchControls();
  }, []);

  const filteredControls = filter === "all" 
    ? controls 
    : controls.filter((c) => c.status === filter);

  const statusCounts = {
    all: controls.length,
    IMPLEMENTED: controls.filter((c) => c.status === "IMPLEMENTED").length,
    IN_PROGRESS: controls.filter((c) => c.status === "IN_PROGRESS").length,
    NOT_IMPLEMENTED: controls.filter((c) => c.status === "NOT_IMPLEMENTED").length,
    NOT_APPLICABLE: controls.filter((c) => c.status === "NOT_APPLICABLE").length,
  };

  if (loading) {
    return (
      <div className="controls-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="controls-page">
      <div className="page-header">
        <h2>Control Monitoring</h2>
        <p className="muted">
          Monitor and manage your compliance controls across all frameworks.
        </p>
      </div>

      <div className="status-summary">
        {(["all", "IMPLEMENTED", "IN_PROGRESS", "NOT_IMPLEMENTED", "NOT_APPLICABLE"] as StatusFilter[]).map((status) => (
          <button
            key={status}
            className={`status-card ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            <span className="count">{statusCounts[status]}</span>
            <span className="label">
              {status === "all" ? "Total" : statusLabels[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="controls-list">
        {filteredControls.length === 0 ? (
          <div className="empty-state">
            <p>No controls found. Select a framework first.</p>
            <button className="cta" onClick={() => router.push("/onboarding")}>
              Select Framework
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Control ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {filteredControls.map((control) => {
                const colors = statusColors[control.status] || statusColors.NOT_IMPLEMENTED;
                return (
                  <tr 
                    key={control.id} 
                    onClick={() => setSelectedControl(control)}
                    className={selectedControl?.id === control.id ? "selected" : ""}
                  >
                    <td className="control-id">{control.controlId}</td>
                    <td className="control-title">{control.title || control.description.slice(0, 50)}</td>
                    <td className="control-category">{control.category || "—"}</td>
                    <td>
                      <span 
                        className="status-pill"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {statusLabels[control.status] || control.status}
                      </span>
                    </td>
                    <td className="control-owner">{control.owner || "Unassigned"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedControl && (
        <div className="control-detail" onClick={() => setSelectedControl(null)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedControl(null)}>×</button>
            <h3>{selectedControl.controlId}</h3>
            <h4>{selectedControl.title || "Untitled Control"}</h4>
            <p className="description">{selectedControl.description}</p>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Category</span>
                <span className="meta-value">{selectedControl.category || "N/A"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span 
                  className="status-pill"
                  style={{ 
                    background: (statusColors[selectedControl.status] || statusColors.NOT_IMPLEMENTED).bg, 
                    color: (statusColors[selectedControl.status] || statusColors.NOT_IMPLEMENTED).text 
                  }}
                >
                  {statusLabels[selectedControl.status] || selectedControl.status}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Owner</span>
                <span className="meta-value">{selectedControl.owner || "Unassigned"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="cta secondary" onClick={() => router.push("/integrations")}>
          Back
        </button>
        <button className="cta" onClick={() => router.push("/evidence")}>
          Continue to Evidence
        </button>
      </div>

      <style jsx>{`
        .controls-page {
          max-width: 1000px;
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
        .status-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .status-card {
          flex: 1;
          min-width: 100px;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .status-card:hover {
          border-color: #0f7f8a;
        }
        .status-card.active {
          border-color: #0f7f8a;
          background: #f0fdfa;
        }
        .status-card .count {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        .status-card .label {
          font-size: 12px;
          color: #6b7280;
        }
        .controls-list {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th {
          text-align: left;
          padding: 14px 16px;
          background: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table td {
          padding: 14px 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #374151;
        }
        .table tr {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .table tr:hover {
          background: #f9fafb;
        }
        .table tr.selected {
          background: #f0fdfa;
        }
        .control-id {
          font-family: monospace;
          font-weight: 600;
          color: #0f7f8a;
        }
        .control-title {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .control-category {
          color: #6b7280;
        }
        .control-owner {
          color: #6b7280;
        }
        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .empty-state {
          text-align: center;
          padding: 48px;
        }
        .empty-state p {
          color: #6b7280;
          margin-bottom: 16px;
        }
        .control-detail {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .detail-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
        }
        .detail-content h3 {
          margin: 0;
          font-size: 14px;
          color: #0f7f8a;
          font-family: monospace;
        }
        .detail-content h4 {
          margin: 8px 0 16px;
          font-size: 18px;
          color: #111827;
        }
        .detail-content .description {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .detail-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .meta-item {
          text-align: center;
        }
        .meta-label {
          display: block;
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .meta-value {
          font-size: 14px;
          color: #111827;
          font-weight: 500;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
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
          .table th:nth-child(3),
          .table td:nth-child(3) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
