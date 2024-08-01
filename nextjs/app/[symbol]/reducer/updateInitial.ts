import { MBP10, State } from "@/app/types"
import instruments from "@/app/[symbol]/instruments"

const updateInitial = (
  state: State,
  action: {
    type: "UPDATE_INITIAL"
    payload: MBP10
  }
): State => {
  const mbp10 = action.payload

  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<string, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<string, number>)

  const priceArray = createCompleteArray(mbp10.levels, state)

  const priceArrayString = priceArray.map((price) => price.toString())

  return {
    ...state,
    marketBuys: {},
    marketSells: {},
    bids: bids,
    offers: offers,
    prices: priceArrayString,
    highest: mbp10.levels[0].bid_px.toString(),
    lowest: mbp10.levels[0].ask_px.toString(),
    loading: false
  }

  // return newState
}

export default updateInitial

function createCompleteArray(
  mbpLevels: { bid_px: number; ask_px: number }[],
  state: State
): number[] {
  const increment = instruments[state.instrument].increment
  
  // Create initial price array and remove duplicates
  const priceArray = Array.from(new Set(mbpLevels.flatMap((level) => [level.bid_px, level.ask_px])))
  priceArray.sort((a, b) => b - a)

  // Create complete price array
  const completePriceArray: number[] = []
  for (let i = 0; i < priceArray.length - 1; i++) {
    const current = priceArray[i]
    const next = priceArray[i + 1]
    completePriceArray.push(current)

    let missing = current - increment
    while (missing > next) {
      completePriceArray.push(missing)
      missing -= increment
    }
  }
  completePriceArray.push(priceArray[priceArray.length - 1])

  // Limit the array to 20 elements
  if (completePriceArray.length > 20) {
    const middleIndex = Math.floor(completePriceArray.length / 2)
    const start = middleIndex - 10
    const end = middleIndex + 10
    return completePriceArray.slice(start, end)
  }

  return completePriceArray
}
