import { initialState } from "../App"
import { MBP10, ReducerAction } from "../types"
import bidLimit from "./bidLimit"
import sellLimit from "./sellLimit"
import { instrument } from "../App"
import updateMbo from "./updateMbo"
import { generateArray } from "../utils/generatePriceArray"

const reducer = (
  state: typeof initialState,
  action: ReducerAction
): typeof initialState => {

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
        prices: state.prices.map((price) => price - instrument.priceTick),
      }

    case "SCROLL_UP":
      if (!state.bids) {
        return state
      }
      return {
        ...state,
        prices: state.prices.map((price) => price + instrument.priceTick),
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
  action: any
): typeof initialState => {
  let newState: typeof initialState | null = null

  const mbp10 = action.payload as MBP10

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
    action.payload.levels.forEach((level) => {
      if (level.ask_px === bidLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, bidLimitPrice, "B"),
        }
      }
    })
  } else if (offerLimitPrice) {
    action.payload.levels.forEach((level) => {
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