import { requireSession } from "@/backend/auth/guard";
import { runMonitoringScheduler } from "@/backend/monitoring/scheduler";
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
          <Image
            src="/complysafe-logo.png"
            alt="ComplySafe logo"
            width={220}
            height={68}
            className="logo-image"
            priority
          />
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
