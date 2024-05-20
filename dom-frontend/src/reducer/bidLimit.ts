
import { getLowestHighest } from "../utils/getLowestHighest"
import { initialState } from "../App"
import { ReducerAction } from "../types"

type TypeBidLimit = ReducerAction & { type: "BID_LIMIT" }
const bidLimit = (
  state: typeof initialState,
  action: TypeBidLimit
): typeof initialState => {
  /* if action hits existing bid, remove */
  if (state.bidLimitOrder === action.payload) {
    return {
      ...state,
      bidLimitOrder: null,
    }
  } else if (
    /* if account is already long || price selected is above market || preexisting bid*/
    state.trade.side === "B" ||
    !state.bids ||
    !state.offers 
    // ||
    // action.payload > getLowest(state.offers)
    // || state.bidLimitOrder
  ) {
    return {
      ...state,
    }
  } else if (action.payload === getLowestHighest(state.offers).lowest) {
    /* market sell */
    return {
      ...state,
      trade: {
        price: state.trade.price ? null : action.payload,
        side: state.trade.price ? "" : "B",
      },
    }
  } else {
    /* add bid */
    return {
      ...state,
      bidLimitOrder: action.payload,
      bids: {
        ...state.bids,
        [action.payload]: state.bids[action.payload]
          ? state.bids[action.payload] + 1
          : 1,
      },
    }
  }
}

export default bidLimit
