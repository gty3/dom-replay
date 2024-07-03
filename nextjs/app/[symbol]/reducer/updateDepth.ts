import { Level, MBP10, State } from "@/app/types"
import executeTrade from "./executeTrade"
import { initialPrices } from "../utils/prices"


const updateDepth = (
  state: State,
  action: {
    type: "UPDATE_DEPTH"
    payload: {
      MBP10: MBP10
      // priceTime: Date
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

  // THIS CAUSES WAY TOO MANY RECENTERS
  // this needs to be set using the time.priceTime cause it doesnt get reset on time change

  // if (state.prices.priceArray.length === 0) {
  //   /* prices have not been updated, return new price array */
  //   newState = {
  //     ...state,
  //     prices: {
  //       priceArray: generateLevelsArray(mbp10).map((price) => price.toString()),
  //       // priceTime: new Date(),
  //     },
  //     offers: offers,
  //     bids: bids,
  //   }
  // } else {
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
