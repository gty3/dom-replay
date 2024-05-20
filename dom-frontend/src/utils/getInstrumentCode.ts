
const getInstrumentCode = (instrumentState: string): string => {
  return instrumentState.slice(0, 2).toLowerCase()
}

export default getInstrumentCode
