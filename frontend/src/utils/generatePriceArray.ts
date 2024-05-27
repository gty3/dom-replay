export const generateArray = (
  lowestNumber: number,
  arrayLength = 19
): number[] => {
  return Array.from({ length: arrayLength }, (_, i) =>
    Number(lowestNumber + i * 10000000)
  ).reverse()
}
