export function answerAuditQuestion(params: {
  question: string;
  evidenceRefs: string[];
}) {
  const q = params.question.toLowerCase();

  if (q.includes("access control")) {
    return {
      answer:
        "Access control is enforced through identity governance, role-based access assignments, and MFA controls across integrated systems.",
      evidenceRefs: params.evidenceRefs
    };
  }

  return {
    answer: "Control implementation is tracked with linked evidence, risk treatment records, and periodic monitoring evidence.",
    evidenceRefs: params.evidenceRefs
  };
}
