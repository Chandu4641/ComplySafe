"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Step {
  id: string;
  label: string;
  href: string;
}

const steps: Step[] = [
  { id: "signup", label: "Company Signup", href: "/onboarding" },
  { id: "frameworks", label: "Frameworks", href: "/frameworks" },
  { id: "integrations", label: "Integrations", href: "/integrations" },
  { id: "controls", label: "Controls", href: "/controls" },
  { id: "evidence", label: "Evidence", href: "/evidence" },
  { id: "readiness", label: "Dashboard", href: "/readiness" },
  { id: "regulatory", label: "Regulatory", href: "/regulatory" },
  { id: "copilot", label: "AI Copilot", href: "/copilot" },
];

interface WorkflowStepperProps {
  currentStep?: string;
}

export default function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const pathname = usePathname();
  
  // Determine current step from pathname if not provided
  const getCurrentStepIndex = () => {
    if (currentStep) {
      return steps.findIndex(s => s.id === currentStep);
    }
    // Match pathname to step using exact match or path boundary
    for (let i = steps.length - 1; i >= 0; i--) {
      const href = steps[i].href;
      if (pathname === href || pathname === href + '/') {
        return i;
      }
    }
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="workflow-stepper">
      <div className="stepper-container">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="step-wrapper">
              <Link 
                href={isCompleted || isCurrent ? step.href : "#"}
                className={`step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""} ${isPending ? "pending" : ""}`}
                onClick={(e) => isPending && e.preventDefault()}
              >
                <div className="step-indicator">
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="step-label">{step.label}</span>
              </Link>
              {index < steps.length - 1 && (
                <div className={`step-connector ${isCompleted ? "completed" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .workflow-stepper {
          padding: 20px 0;
          margin-bottom: 24px;
        }
        .stepper-container {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0;
        }
        .step-wrapper {
          display: flex;
          align-items: center;
        }
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        .step:hover:not(.pending) {
          color: #0f7f8a;
        }
        .step.completed {
          color: #0f7f8a;
        }
        .step.current {
          color: #0f7f8a;
        }
        .step.pending {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .step-indicator {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .step.completed .step-indicator {
          background: #0f7f8a;
          border-color: #0f7f8a;
          color: white;
        }
        .step.current .step-indicator {
          background: white;
          border-color: #0f7f8a;
          color: #0f7f8a;
          box-shadow: 0 0 0 4px rgba(15, 127, 138, 0.1);
        }
        .step-label {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .step-connector {
          width: 40px;
          height: 2px;
          background: #e5e7eb;
          margin: 0 8px;
          margin-bottom: 24px;
          transition: background 0.2s ease;
        }
        .step-connector.completed {
          background: #0f7f8a;
        }
        @media (max-width: 768px) {
          .stepper-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .step-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
          .step {
            flex-direction: row;
            padding: 8px 0;
          }
          .step-label {
            margin-top: 0;
            margin-left: 12px;
          }
          .step-connector {
            width: 2px;
            height: 24px;
            margin: 0;
            margin-left: 17px;
          }
        }
      `}</style>
    </div>
  );
}
