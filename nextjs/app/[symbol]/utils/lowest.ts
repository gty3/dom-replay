const getLowestValue = (map: Record<string, number>): number | null => {
  const numericKeys = Object.keys(map).map(Number);
  return numericKeys.length > 0 ? Math.min(...numericKeys) : null;
}

export default getLowestValue