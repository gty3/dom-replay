import { Level, MBP10, State } from "@/app/types";
import executeTrade from "./executeTrade"
import { initialPrices } from "../utils/prices";

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

  // if state prices == const prices
  if (JSON.stringify(state.prices) === JSON.stringify(initialPrices)) {
    
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

export default updateDepth