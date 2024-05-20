
export const getLowestHighest = (
  record: Record<string, number>
): { lowest: number | null; highest: number | null } => {
  const keys = Object.keys(record).map(Number)
  const lowest = Math.min(...keys)
  const highest = Math.max(...keys)
  return {
    lowest: isFinite(lowest) ? lowest : null,
    highest: isFinite(highest) ? highest : null,
  }
}
