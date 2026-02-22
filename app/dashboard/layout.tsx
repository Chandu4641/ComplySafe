import { requireSession } from "@/lib/auth/guard";
import { runMonitoringScheduler } from "@/lib/monitoring/scheduler";
import Image from "next/image";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (process.env.NODE_ENV === "production") {
    await runMonitoringScheduler().catch(() => null);
  }
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">
            <Image
              src="/complysafe-logo.png"
              alt="ComplySafe logo"
              width={32}
              height={32}
            />
          </span>
          <div className="logo-text">
            <div className="logo-title">ComplySafe</div>
            <div className="logo-sub">Compliance Automation</div>
          </div>
        </div>
        <div style={{ marginTop: 8 }} className="muted">{session.org.name}</div>
        <div style={{ marginTop: 16 }} className="muted">Compliance Workspace</div>
        <div style={{ marginTop: 24 }} className="steps">
          <div>Overview</div>
          <div>
            <a href="/dashboard/public-scan">Public Scan</a>
          </div>
          <div>Findings</div>
          <div>Policies</div>
          <div>Remediation</div>
          <div>Evidence</div>
          <div>Audit Export</div>
        </div>
        <form action="/api/auth/logout" method="post" style={{ marginTop: 24 }}>
          <button className="cta" style={{ width: "100%" }}>Log out</button>
        </form>
      </aside>
      <main className="main">
        {children}
      </main>
    </div>
  );
}
