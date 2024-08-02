import { State, ReducerAction } from "../../types"

type TypeBidLimit = ReducerAction & { type: "BID_LIMIT" }
const bidLimit = (
  state: State,
  action: TypeBidLimit
): State => {
  /* if action hits existing bid, remove */
  if (state.bidLimitOrder === action.payload) {
    return {
      ...state,
      bidLimitOrder: null,
    }
  } else if (
    /* if account is already long || price selected is above market || preexisting bid*/
    state.trade.side === 66 ||
    !state.bids ||
    !state.offers 
    // ||
    // action.payload > getLowest(state.offers)
    // || state.bidLimitOrder
  ) {
    return {
      ...state,
    }
  } else if ("" + action.payload === state.lowest) {
    /* market sell */
    return {
      ...state,
      trade: {
        price: state.trade.price ? null : action.payload,
        side: state.trade.price ? 0 : 66,
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
