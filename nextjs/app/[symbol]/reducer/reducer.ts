import { Level, MBP10, ReducerAction, State  } from "../../types"
import bidLimit from "./bidLimit"
import sellLimit from "./sellLimit"
import updateMbo from "./updateMbo"
import executeTrade from "./executeTrade"
  
const reducer = (
  state: State,
  action: ReducerAction
): State => {

  switch (action.type) {
    case "UPDATE_MBO":
      return updateMbo(state, action)

    case "BID_LIMIT":
      return bidLimit(state, action)

    case "SELL_LIMIT":
      return sellLimit(state, action)

    case "SCROLL_DOWN":
      if (!state.bids) {
        return state
      }
      const decimalPlaces =
        action.payload.toString().split(".")[1]?.length || 0
      return {
        ...state,
        prices: state.prices.map((price) => (parseFloat(price) - action.payload).toFixed(decimalPlaces)),
      }

    case "SCROLL_UP":
      if (!state.bids) {
        return state
      }
      const decimalPlaces1 =
        action.payload.toString().split(".")[1]?.length || 0
      return {
        ...state,
        prices: state.prices.map((price) => (parseFloat(price) + action.payload).toFixed(decimalPlaces1)),
      }

    case "UPDATE_DEPTH":

      return updateDepth(state, action)

    default:
      return state
  }
}

export default reducer

function generateLevelsArray(mbp10: MBP10) {
  const levelsArray = [];
  for (let i = 0; i < 9; i++) { // Loop through levels 0 to 8
    levelsArray.push(parseFloat(mbp10.levels[i].bid_px), parseFloat(mbp10.levels[i].ask_px));
    if (levelsArray.length >= 18) break; // Ensure only 18 entries are added
  }
  levelsArray.sort((a, b) => a - b); // Sort the numbers
  return levelsArray.map(price => price.toString()); // Convert numbers back to strings
}

const updateDepth = (
  state: State,
  action: { type: "UPDATE_DEPTH"; payload: MBP10 }
): State => {
  let newState: State | null = null

  const mbp10 = action.payload

  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<string, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<string, number>)
  console.log(generateLevelsArray(mbp10))
  if (JSON.stringify(state.prices) === JSON.stringify(generateLevelsArray(mbp10))) {
    
    /* prices have not been updated, return new price array */
    newState = {
      ...state,
      prices: generateLevelsArray(mbp10).map((price) => price.toString()),
      offers: offers,
      bids: bids,
    }
  } else {
    /* update depth */
    newState = {
      ...state,
      offers: offers,
      bids: bids,
      lowest: "" + mbp10.levels[0].ask_px,
      highest: "" + mbp10.levels[0].bid_px
    }
    }

  const bidLimitPrice = "" + state.bidLimitOrder
  const offerLimitPrice = "" + state.offerLimitOrder


  if (bidLimitPrice) {
    action.payload.levels.forEach((level: Level) => {
      if (level.ask_px === bidLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, parseFloat(bidLimitPrice), "B"),
        }
      }
    })
  } else if (offerLimitPrice) {
    action.payload.levels.forEach((level: Level) => {
      /* if there is an bid that exists at the same price i have an open offer */
      if (level.bid_px === offerLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, parseFloat(offerLimitPrice), "S"),
        }
      }
    })
  }

  return newState
}