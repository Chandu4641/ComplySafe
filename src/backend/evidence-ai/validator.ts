import { analyzeEvidenceContent } from "@/backend/evidence-ai/analysis";
import { buildEvidenceRecommendations } from "@/backend/evidence-ai/recommendations";

export function validateEvidenceWithAi(params: {
  source: string;
  fileRef?: string | null;
  uploadedAt?: Date;
}) {
  const analysis = analyzeEvidenceContent(params);
  const recommendations = buildEvidenceRecommendations({
    hasPayload: analysis.hasPayload,
    stalenessDays: analysis.stalenessDays
  });

  const valid = analysis.hasPayload && analysis.stalenessDays <= 180;

  return {
    valid,
    confidence: valid ? 0.86 : 0.51,
    analysis,
    recommendations
  };
}
