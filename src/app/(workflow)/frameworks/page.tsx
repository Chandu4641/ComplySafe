"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Framework {
  id: string;
  key: string;
  name: string;
  description?: string;
  version?: string;
  enabled: boolean;
  controlCount?: number;
}

const frameworkInfo: Record<string, { description: string; controls: number; icon: string }> = {
  ISO27001: {
    description: "Information Security Management System",
    controls: 93,
    icon: "🔐",
  },
  SOC2: {
    description: "Service Organization Control",
    controls: 64,
    icon: "📊",
  },
  HIPAA: {
    description: "Health Insurance Portability and Accountability Act",
    controls: 54,
    icon: "🏥",
  },
  PCI: {
    description: "Payment Card Industry Data Security Standard",
    controls: 78,
    icon: "💳",
  },
};

export default function FrameworkSelectionPage() {
  const router = useRouter();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFrameworks() {
      try {
        const res = await fetch("/api/frameworks");
        if (!res.ok) {
          throw new Error(`Failed to fetch frameworks: ${res.status}`);
        }
        const data = await res.json();
        if (data.frameworks) {
          setFrameworks(data.frameworks);
          // Pre-select already enabled frameworks
          const enabled = data.frameworks.filter((f: Framework) => f.enabled).map((f: Framework) => f.key);
          setSelected(enabled);
        }
      } catch (err) {
        // Provide more specific error messages based on error type
        if (err instanceof Error && err.message.includes('401')) {
          setError("Your session has expired. Please log in again.");
        } else if (err instanceof Error && err.message.includes('403')) {
          setError("You don't have permission to view frameworks.");
        } else {
          setError("Failed to load frameworks. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchFrameworks();
  }, []);

  const toggleFramework = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      setError("Please select at least one framework");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/frameworks/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameworkKeys: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save frameworks");
      }

      router.push("/integrations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="framework-selection">
        <div className="loading">
          <div className="spinner" />
          <p>Loading frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="framework-selection">
      <div className="page-header">
        <h2>Select Compliance Frameworks</h2>
        <p className="muted">
          Choose the frameworks you want to comply with. You can always add more later.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="framework-grid">
        {frameworks.map((framework) => {
          const info = frameworkInfo[framework.key] || {
            description: framework.description || "",
            controls: 0,
            icon: "📋",
          };
          const isSelected = selected.includes(framework.key);

          return (
            <div
              key={framework.id}
              className={`framework-card ${isSelected ? "selected" : ""} ${framework.enabled ? "enabled" : ""}`}
              onClick={() => toggleFramework(framework.key)}
            >
              <div className="card-header">
                <span className="framework-icon">{info.icon}</span>
                <div className="checkbox">
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <h3>{framework.name}</h3>
              <p className="description">{info.description}</p>
              <div className="card-footer">
                <span className="control-count">{info.controls} controls</span>
                {framework.enabled && <span className="enabled-badge">Active</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="actions">
        <div className="selected-count">
          {selected.length} framework{selected.length !== 1 ? "s" : ""} selected
        </div>
        <button
          className="cta"
          onClick={handleContinue}
          disabled={saving || selected.length === 0}
        >
          {saving ? "Saving..." : "Continue to Integrations"}
        </button>
      </div>

      <style jsx>{`
        .framework-selection {
          max-width: 900px;
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
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .framework-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .framework-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .framework-card:hover {
          border-color: #0f7f8a;
          box-shadow: 0 4px 12px rgba(15, 127, 138, 0.1);
        }
        .framework-card.selected {
          border-color: #0f7f8a;
          background: #f0fdfa;
        }
        .framework-card.enabled {
          border-color: #22c55e;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .framework-icon {
          font-size: 32px;
        }
        .checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .framework-card.selected .checkbox {
          background: #0f7f8a;
          border-color: #0f7f8a;
          color: white;
        }
        .framework-card h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #111827;
        }
        .description {
          margin: 0 0 16px;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .control-count {
          font-size: 13px;
          color: #6b7280;
        }
        .enabled-badge {
          font-size: 12px;
          color: #16a34a;
          background: #dcfce7;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .selected-count {
          font-size: 14px;
          color: #6b7280;
        }
        .cta {
          background: #0f7f8a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .cta:hover:not(:disabled) {
          background: #0d706e;
        }
        .cta:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .framework-grid {
            grid-template-columns: 1fr;
          }
          .actions {
            flex-direction: column;
            gap: 16px;
          }
          .cta {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
