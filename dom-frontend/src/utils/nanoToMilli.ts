const nanoToMilli = (input: string | number): number => {
  const numberInput = typeof input === "string" ? parseFloat(input) : input
  return numberInput / 1000000
}

export default nanoToMilli