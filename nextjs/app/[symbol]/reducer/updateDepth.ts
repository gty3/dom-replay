import { Level, MBP10, State } from "@/app/types"
import executeTrade from "./executeTrade"

const updateDepth = (
  state: State,
  action: {
    type: "UPDATE_DEPTH"
    payload: {
      MBP10: MBP10
    }
  }
): State => {
  let newState: State | null = null

  const { MBP10: mbp10 } = action.payload

  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<string, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<string, number>)

  /* If incoming data is a trade mbp10, update the market buy/sell size */
  if (mbp10.action === 84) {
    if (mbp10.side === 65) {
      newState = {
        ...state,
        marketSells: {
          ...state.marketSells,
          [mbp10.price]: state.marketSells[mbp10.price]
            ? state.marketSells[mbp10.price] + mbp10.size
            : mbp10.size,
        },
      }
    } else if (mbp10.side === 66) {
      newState = {
        ...state,
        marketBuys: {
          ...state.marketBuys,
          [mbp10.price]: state.marketBuys[mbp10.price]
            ? state.marketBuys[mbp10.price] + mbp10.size
            : mbp10.size,
        },
      }
    }
  }

  /* all else, update the limit order price */
  newState = {
    ...(newState || state),
    offers: offers,
    bids: bids,
    lowest: "" + mbp10.levels[0].ask_px,
    highest: "" + mbp10.levels[0].bid_px,
  }

  if (mbp10.levels[0].ask_px === state.bidLimitOrder) {
    console.log("Executing buy trade")
    newState = {
      ...newState,
      ...executeTrade(state, state.bidLimitOrder, 66),
    }
  } else if (mbp10.levels[0].bid_px === state.offerLimitOrder) {
    console.log("Executing sell trade")
    newState = {
      ...newState,
      ...executeTrade(state, state.offerLimitOrder, 65),
    }
  }

  return newState
}

export default updateDepth
