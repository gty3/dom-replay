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
  if (mbp10.action === 84) { console.log('trade', mbp10.size)}
  
  const offers = mbp10.levels.reduce((acc, level) => {
    acc[level.ask_px] = level.ask_sz
    return acc
  }, {} as Record<string, number>)

  const bids = mbp10.levels.reduce((acc, level) => {
    acc[level.bid_px] = level.bid_sz
    return acc
  }, {} as Record<string, number>)

    /* update depth */
    newState = {
      ...state,
      offers: offers,
      bids: bids,
      lowest: "" + mbp10.levels[0].ask_px,
      highest: "" + mbp10.levels[0].bid_px,
    }
  // }

  const bidLimitPrice = "" + state.bidLimitOrder
  const offerLimitPrice = "" + state.offerLimitOrder

  if (bidLimitPrice) {
    mbp10.levels.forEach((level: Level) => {
      if (level.ask_px === bidLimitPrice) {
        newState = {
          ...state,
          ...executeTrade(state, parseFloat(bidLimitPrice), "B"),
        }
      }
    })
  } else if (offerLimitPrice) {
    mbp10.levels.forEach((level: Level) => {
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

export default updateDepth
