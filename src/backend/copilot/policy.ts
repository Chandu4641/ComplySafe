export type CopilotActionType = "create_task" | "assign_owner" | "mark_exception";
export type CopilotTargetType = "control" | "risk";

export type CopilotAction = {
  type: CopilotActionType;
  targetType: CopilotTargetType;
  targetId: string;
  justification: string;
};

export type CopilotDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

const HIGH_RISK_ACTIONS = new Set<CopilotActionType>(["mark_exception"]);

export function evaluateCopilotAction(action: CopilotAction): CopilotDecision {
  if (!action.targetId.trim()) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: "targetId is required"
    };
  }

  if (!action.justification.trim()) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: "justification is required"
    };
  }

  const requiresApproval = HIGH_RISK_ACTIONS.has(action.type);
  return {
    allowed: true,
    requiresApproval,
    reason: requiresApproval ? "High-risk action requires explicit human approval" : "Allowed"
  };
}
