import { getPolicyTemplate } from "@/backend/policy-ai/templates";

export function generatePolicyDraft(params: {
  orgName: string;
  templateKey: string;
  frameworkKey: string;
}) {
  const template = getPolicyTemplate(params.templateKey);
  const header = `${template.title}\nOrganization: ${params.orgName}\nFramework: ${params.frameworkKey}\n`;
  const body = template.sections
    .map((section, index) => `${index + 1}. ${section}\n${section} requirements for ${params.orgName} aligned with ${params.frameworkKey}.`)
    .join("\n\n");

  return {
    title: template.title,
    generatedFrom: `${params.frameworkKey}:${template.key}`,
    content: `${header}\n${body}`
  };
}
