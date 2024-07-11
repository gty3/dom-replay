import { MBP10, State } from "@/app/types"

function generateLevelsArray(mbp10: MBP10) {
  const levelsArray = []
  for (let i = 0; i < 9; i++) {
    // Loop through levels 0 to 8
    levelsArray.push(
      parseFloat(mbp10.levels[i].bid_px),
      parseFloat(mbp10.levels[i].ask_px)
    )
    if (levelsArray.length >= 18) break // Ensure only 18 entries are added
  }
  levelsArray.sort((a, b) => b - a) // Sort the numbers
  return levelsArray.map((price) => price.toString()) // Convert numbers back to strings
}

const updatePriceArray = (
  state: State,
  action: {
    type: "UPDATE_PRICE_ARRAY"
    payload: {
      priceArray: number[]
      time: number
    }
  }
): State => {
  let newState = {
    ...state,
    marketBuys: {},
    marketSells: {},
    prices: action.payload.priceArray.map((price) => price.toString()),
    // datasetTime: new Date(mbp10.dataset_time?? "")
  }

  return newState
}

export default updatePriceArray
