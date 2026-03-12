"use client";

import WorkflowStepper from "@/components/workflow/WorkflowStepper";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="workflow-layout">
      <header className="workflow-header">
        <div className="container">
          <h1 className="logo">ComplySafe</h1>
          <p className="tagline">Compliance Workflow</p>
        </div>
      </header>
      <main className="workflow-main">
        <div className="container">
          <WorkflowStepper />
          <div className="workflow-content">
            {children}
          </div>
        </div>
      </main>
      <style jsx>{`
        .workflow-layout {
          min-height: 100vh;
          background: #fafafa;
        }
        .workflow-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 0;
        }
        .workflow-header .container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #0f7f8a;
          margin: 0;
        }
        .tagline {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        .workflow-main {
          padding: 24px 0;
        }
        .workflow-main .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .workflow-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 768px) {
          .workflow-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
