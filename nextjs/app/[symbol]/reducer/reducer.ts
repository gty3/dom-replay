import { Level, MBP10, ReducerAction, State,  } from "../../../../../frontend/src/types"
import bidLimit from "./bidLimit"
import sellLimit from "./sellLimit"
import { instrument } from "../../../../../frontend/src/instrument"
import updateMbo from "./updateMbo"
import { generateArray } from "../../../../../frontend/src/utils/generatePriceArray"
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
      return {
        ...state,
        prices: state.prices.map((price) => price - 10000000),
      }

    case "SCROLL_UP":
      if (!state.bids) {
        return state
      }
      return {
        ...state,
        prices: state.prices.map((price) => price + 10000000),
      }

    case "UPDATE_DEPTH":

      return updateDepth(state, action)

    default:
      return state
  }
}

export default reducer

const updateDepth = (
  state: typeof initialState,
  action: { type: "UPDATE_DEPTH"; payload: MBP10 }
): typeof initialState => {
  let newState: typeof initialState | null = null

  const mbp10 = action.payload

  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<number, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<number, number>)

  if (JSON.stringify(state.prices) === JSON.stringify(instrument.array)) {
    /* prices have not been updated, return new price array */
    newState = {
      ...state,
      prices: generateArray(mbp10.levels[9].bid_px),
      offers: offers,
      bids: bids,
    }
  } else {
    /* update depth */
    newState = {
      ...state,
      offers: offers,
      bids: bids,
    }
  }

  const bidLimitPrice = state.bidLimitOrder
  const offerLimitPrice = state.offerLimitOrder


  if (bidLimitPrice) {
    action.payload.levels.forEach((level: Level) => {
      if (level.ask_px === bidLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, bidLimitPrice, "B"),
        }
      }
    })
  } else if (offerLimitPrice) {
    action.payload.levels.forEach((level: Level) => {
      /* if there is an bid that exists at the same price i have an open offer */
      if (level.bid_px === offerLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, offerLimitPrice, "S"),
        }
      }
    })
  }

  return newState
}