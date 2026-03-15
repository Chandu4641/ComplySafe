"use client";

import Image from "next/image";
import WorkflowStepper from "@/components/workflow/WorkflowStepper";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="workflow-layout">
      <header className="workflow-header">
        <div className="logo-container">
          <a href="/" className="logo-link">
            <Image
              src="/complysafe-logo.png"
              alt="ComplySafe logo"
              width={180}
              height={55}
              sizes="(max-width: 768px) 140px, 180px"
              className="logo-image"
              priority
              style={{ borderRadius: "8px" }}
            />
          </a>
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
        .workflow-header .logo-container {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .logo-link {
          display: block;
          line-height: 0;
        }
        .logo-image {
          width: auto;
          height: 40px;
          object-fit: contain;
        }
        .tagline {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          padding-left: 16px;
          border-left: 1px solid #e5e7eb;
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
