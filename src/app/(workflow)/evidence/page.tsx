"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface Evidence {
  id: string;
  source: string;
  status: string;
  uploadedAt: string;
  expiresAt: string | null;
  control?: { controlId: string };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  VALID: { bg: "#dcfce7", text: "#16a34a" },
  EXPIRED: { bg: "#fee2e2", text: "#dc2626" },
  MISSING: { bg: "#fef3c7", text: "#d97706" },
};

export default function EvidencePage() {
  const router = useRouter();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [uploadStatus, setUploadStatus] = useState<"success" | "error" | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  const fetchEvidence = useCallback(async () => {
    try {
      const res = await fetch("/api/evidence");
      if (!res.ok) {
        throw new Error(`Failed to fetch evidence: ${res.status}`);
      }
      const data = await res.json();
      setEvidence(data.evidence || []);
    } catch (err) {
      console.error("Failed to load evidence", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "manual_upload");

      const res = await fetch("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadStatus("success");
        setUploadMessage("Evidence uploaded successfully!");
        await fetchEvidence();
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadStatus("error");
        setUploadMessage(errorData.message || "Failed to upload evidence. Please try again.");
      }
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage("Upload failed. Please try again.");
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredEvidence = filter === "all"
    ? evidence
    : evidence.filter((e) => e.status === filter);

  const statusCounts = {
    all: evidence.length,
    VALID: evidence.filter((e) => e.status === "VALID").length,
    EXPIRED: evidence.filter((e) => e.status === "EXPIRED").length,
    MISSING: evidence.filter((e) => e.status === "MISSING").length,
  };

  if (loading) {
    return (
      <div className="evidence-page">
        <div className="loading">
          <div className="spinner" />
          <p>Loading evidence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-page">
      <div className="page-header">
        <h2>Evidence Collection</h2>
        <p className="muted">
          Upload and manage compliance evidence to support your controls.
        </p>
      </div>

      <div
        className={`upload-zone ${dragActive ? "active" : ""} ${uploading ? "uploading" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleFileSelect}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        />
        <label htmlFor="file-upload">
          {uploading ? (
            <>
              <div className="spinner small" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 8v24M8 20h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span>Drop files here or click to upload</span>
              <span className="hint">PDF, DOC, DOCX, PNG, JPG (max 10MB)</span>
            </>
          )}
        </label>
        {uploadStatus && (
          <div className={`upload-message ${uploadStatus}`}>
            {uploadMessage}
          </div>
        )}
      </div>

      <div className="status-tabs">
        {(["all", "VALID", "EXPIRED", "MISSING"] as const).map((status) => (
          <button
            key={status}
            className={`status-tab ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            <span className="count">{statusCounts[status]}</span>
            <span className="label">{status === "all" ? "All" : status}</span>
          </button>
        ))}
      </div>

      <div className="evidence-list">
        {filteredEvidence.length === 0 ? (
          <div className="empty-state">
            <p>No evidence uploaded yet. Use the upload zone above.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Control</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvidence.map((item) => {
                const colors = statusColors[item.status] || statusColors.MISSING;
                return (
                  <tr key={item.id}>
                    <td className="source">{item.source}</td>
                    <td className="control">{item.control?.controlId || "—"}</td>
                    <td>
                      <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>
                        {item.status}
                      </span>
                    </td>
                    <td className="date">{new Date(item.uploadedAt).toLocaleDateString()}</td>
                    <td className="date">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="actions">
        <button className="cta secondary" onClick={() => router.push("/controls")}>
          Back
        </button>
        <button className="cta" onClick={() => router.push("/readiness")}>
          View Compliance Dashboard
        </button>
      </div>

      <style jsx>{`
        .evidence-page {
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
        .spinner.small {
          width: 24px;
          height: 24px;
          border-width: 2px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          margin-bottom: 24px;
          transition: all 0.2s ease;
          background: #fafafa;
        }
        .upload-zone:hover,
        .upload-zone.active {
          border-color: #0f7f8a;
          background: #f0fdfa;
        }
        .upload-zone.uploading {
          pointer-events: none;
          opacity: 0.7;
        }
        .upload-zone input {
          display: none;
        }
        .upload-zone label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .upload-zone svg {
          color: #9ca3af;
        }
        .upload-zone span {
          font-size: 15px;
          color: #374151;
        }
        .upload-zone .hint {
          font-size: 13px;
          color: #9ca3af;
        }
        .upload-message {
          margin-top: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .upload-message.success {
          background: #dcfce7;
          color: #16a34a;
        }
        .upload-message.error {
          background: #fee2e2;
          color: #dc2626;
        }
        .status-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .status-tab {
          flex: 1;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .status-tab:hover {
          border-color: #0f7f8a;
        }
        .status-tab.active {
          border-color: #0f7f8a;
          background: #f0fdfa;
        }
        .status-tab .count {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }
        .status-tab .label {
          font-size: 12px;
          color: #6b7280;
        }
        .evidence-list {
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
        .source {
          font-weight: 500;
        }
        .control {
          font-family: monospace;
          color: #0f7f8a;
        }
        .date {
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
          color: #6b7280;
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
          .table th:nth-child(2),
          .table td:nth-child(2),
          .table th:nth-child(5),
          .table td:nth-child(5) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
