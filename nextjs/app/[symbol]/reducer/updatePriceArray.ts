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
      MBP10: MBP10
    }
  }
): State => {
  let newState: State | null = null
  const { MBP10: mbp10 } = action.payload
  newState = {
    ...state,
    marketBuys: {},
    marketSells: {},
    prices:  generateLevelsArray(mbp10).map((price) => price.toString()),
  }

  return newState
}

export default updatePriceArray