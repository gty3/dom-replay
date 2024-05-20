
import { getLowestHighest } from "../utils/getLowestHighest"
import { initialState } from "../App"
import { ReducerAction } from "../types"

type TypeSellLimit = ReducerAction & { type: "SELL_LIMIT" }

const sellLimit = (
  state: typeof initialState,
  action: TypeSellLimit
): typeof initialState => {
  if (state.offerLimitOrder === action.payload) {
    return {
      ...state,
      offerLimitOrder: null,
    }
  } else if (
    /* if account is already short || price selected is below market || offer already exists*/
    state.trade.side === "S" ||
    !state.offers ||
    !state.bids 
    // ||
    // action.payload < getHighest(state.bids)
    // || state.offerLimitOrder
  ) {
    return {
      ...state,
    }
  } else if (action.payload === getLowestHighest(state.bids).highest) {
    /* market sell */
    return {
      ...state,
      trade: {
        price: state.trade.price ? null : action.payload,
        side: state.trade.price ? "" : "S",
      },
    }
  } else {
    /* add offer */
    return {
      ...state,
      offerLimitOrder: action.payload,
      /* make your trade added to limit numbers */
      offers: {
        ...state.offers,
        [action.payload]: state.offers[action.payload]
          ? state.offers[action.payload] + 1
          : 1,
      },
    }
  }
}

export default sellLimit
