export function reviewPolicyDraft(content: string) {
  const hasPurpose = /purpose/i.test(content);
  const hasScope = /scope/i.test(content);
  const hasControlLanguage = /control|enforce|review|audit/i.test(content);

  const issues: string[] = [];
  if (!hasPurpose) issues.push("Missing purpose section");
  if (!hasScope) issues.push("Missing scope section");
  if (!hasControlLanguage) issues.push("Policy language lacks enforceable control statements");

  return {
    pass: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 30)
  };
}
