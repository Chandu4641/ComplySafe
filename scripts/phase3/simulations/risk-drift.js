function driftDetected(trend, threshold) {
  if (!Array.isArray(trend) || trend.length !== 3) return false;
  const nonDecreasing = trend[1] >= trend[0] && trend[2] >= trend[1];
  return nonDecreasing && trend[2] - trend[0] >= threshold;
}

if (!driftDetected([8, 10, 12], 3)) {
  throw new Error("Expected upward trend to trigger drift");
}

if (driftDetected([8, 7, 9], 3)) {
  throw new Error("Expected mixed trend to avoid drift");
}
