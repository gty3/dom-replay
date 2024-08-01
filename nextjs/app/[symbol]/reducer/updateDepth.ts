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

  newState = {
    ...(newState || state),
    offers: offers,
    bids: bids,
    lowest: "" + mbp10.levels[0].ask_px,
    highest: "" + mbp10.levels[0].bid_px,
  }

  const bidLimitPrice = "" + state.bidLimitOrder
  const offerLimitPrice = "" + state.offerLimitOrder

  mbp10.levels.forEach((level: Level) => {
    if (bidLimitPrice && level.ask_px === parseFloat(bidLimitPrice)) {
      console.log('Executing buy trade');
      newState = {
        ...state,
        ...executeTrade(state, parseFloat(bidLimitPrice), "B"),
      };
    } else if (offerLimitPrice && level.bid_px === parseFloat(offerLimitPrice)) {
      console.log('Executing sell trade');
      newState = {
        ...state,
        ...executeTrade(state, parseFloat(offerLimitPrice), "S"),
      };
    }
  });

  return newState
}

export default updateDepth
