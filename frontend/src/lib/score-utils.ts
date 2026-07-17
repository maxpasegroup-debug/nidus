export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function averageFinite(values: number[]) {
  const usefulValues = values.filter((value) => Number.isFinite(value));
  return usefulValues.length ? usefulValues.reduce((sum, value) => sum + value, 0) / usefulValues.length : 0;
}
