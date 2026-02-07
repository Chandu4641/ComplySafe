import { requireSession } from "@/lib/auth/guard";
import { getDashboardStats, getFindings, getRecentScans } from "@/lib/data/queries";
import ScannerPanel from "./ScannerPanel";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.orgId);
  const findings = await getFindings(session.orgId);
  const scans = await getRecentScans(session.orgId);
  return (
    <>
      <h1>Compliance Overview</h1>
      <p className="muted">Your real-time readiness across selected frameworks.</p>

      <div className="kpi-grid" style={{ marginTop: 20 }}>
        <div className="kpi">
          <div className="muted">Coverage</div>
          <strong>{stats.coverage}%</strong>
        </div>
        <div className="kpi">
          <div className="muted">Open Risks</div>
          <strong>{stats.openRisks}</strong>
        </div>
        <div className="kpi">
          <div className="muted">Evidence Items</div>
          <strong>{stats.evidence}</strong>
        </div>
        <div className="kpi">
          <div className="muted">Audit ETA</div>
          <strong>18 days</strong>
        </div>
      </div>

      <section className="section">
        <ScannerPanel />
      </section>

      <section className="section">
        <div className="panel">
          <h2>Recent Scans</h2>
          {scans.length === 0 ? (
            <p className="muted">No scans yet. Run your first scan above.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.id}>
                    <td>{s.sourceName}</td>
                    <td>{s.type}</td>
                    <td>{s.level}</td>
                    <td>{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <h2>Risk Heatmap</h2>
          <div style={{ marginTop: 8 }}>
            <a className="cta secondary" href="/api/audits/export/pdf">Download Audit PDF</a>
          </div>
          <div className="heatmap">
            {["Access", "Logging", "Change", "Backup", "Vendors", "Data"].map((label, idx) => (
              <div key={label} className={`heat ${idx % 3 === 0 ? "high" : idx % 3 === 1 ? "med" : "low"}`}>
                <div className="muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <h2>Top Findings</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Control</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.control}</td>
                  <td>
                    <span className={`pill ${f.severity === "High" ? "risk" : f.severity === "Medium" ? "warn" : "ok"}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td>{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
