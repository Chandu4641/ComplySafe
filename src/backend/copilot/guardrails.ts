import { evaluateCopilotAction, type CopilotAction } from "@/backend/copilot/policy";

const HIGH_IMPACT_ACTIONS = new Set<CopilotAction["type"]>(["mark_exception"]);

export function requireHumanApprovalForSensitiveAction(action: CopilotAction) {
  return HIGH_IMPACT_ACTIONS.has(action.type);
}

export function enforceCopilotActionGuardrails(params: {
  action: CopilotAction;
  approved: boolean;
}) {
  const policyDecision = evaluateCopilotAction(params.action);
  if (!policyDecision.allowed) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: policyDecision.reason
    };
  }

  const requiresApproval = requireHumanApprovalForSensitiveAction(params.action) || policyDecision.requiresApproval;
  if (requiresApproval && !params.approved) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: "Human approval is required before this AI action can execute"
    };
  }

  return {
    allowed: true,
    requiresApproval,
    reason: "Guardrails passed"
  };
}
