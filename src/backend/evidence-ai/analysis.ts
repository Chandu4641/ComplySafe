export function analyzeEvidenceContent(params: {
  source: string;
  fileRef?: string | null;
  uploadedAt?: Date;
}) {
  const stalenessDays = params.uploadedAt
    ? Math.floor((Date.now() - params.uploadedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    hasPayload: Boolean(params.source || params.fileRef),
    sourceType: params.source || "manual",
    stalenessDays
  };
}
