const getHighestValue = (map: Record<string, number>): number | null => {
  const numericKeys = Object.keys(map).map(Number);
  return numericKeys.length > 0 ? Math.max(...numericKeys) : null;
}

export default getHighestValue