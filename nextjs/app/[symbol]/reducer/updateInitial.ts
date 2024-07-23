import { MBP10, State } from "@/app/types"

const updateInitial = (
  state: State,
  action: {
    type: "UPDATE_INITIAL"
    payload: MBP10
  }
): State => {
  const mbp10 = action.payload

  console.log(mbp10)

  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<string, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<string, number>)

  const allPrices = mbp10.levels.flatMap(level => [level.bid_px, level.ask_px]);
  const lowest = Math.min(...allPrices);
  const highest = Math.max(...allPrices);
  const priceArray = [1,2,3,4,5,6,7,8,9,10]
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
  }

  // return newState
}

export default updateInitial

function createCompleteArray(mbpLevels: { bid_px: number; ask_px: number }[]): number[] {
  const clIncrement = 0.0001; // Assuming the increment is 0.0001 (converted from 10000000)

  // Create initial price array
  let priceArray = mbpLevels.flatMap(level => [level.bid_px, level.ask_px]);
  priceArray.sort((a, b) => b - a);

  // Create complete price array
  let completePriceArray: number[] = [];
  for (let i = 0; i < priceArray.length - 1; i++) {
    const current = priceArray[i];
    const next = priceArray[i + 1];
    completePriceArray.push(current);

    const expectedNext = current - clIncrement;
    if (next < expectedNext) {
      let missing = expectedNext;
      while (missing > next) {
        completePriceArray.push(missing);
        missing -= clIncrement;
      }
    }
  }
  completePriceArray.push(priceArray[priceArray.length - 1]);

  return completePriceArray;
}