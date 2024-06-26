import { Level, MBP10, ReducerAction, State  } from "../../types"
import bidLimit from "./bidLimit"
import sellLimit from "./sellLimit"
import updateMbo from "./updateMbo"
import updateDepth from "./updateDepth"
  
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
      const decimalPlaces =
        action.payload.toString().split(".")[1]?.length || 0
      return {
        ...state,
        prices: state.prices.map((price) => (parseFloat(price) - action.payload).toFixed(decimalPlaces)),
      }

    case "SCROLL_UP":
      if (!state.bids) {
        return state
      }
      const decimalPlaces1 =
        action.payload.toString().split(".")[1]?.length || 0
      return {
        ...state,
        prices: state.prices.map((price) => (parseFloat(price) + action.payload).toFixed(decimalPlaces1)),
      }

    case "UPDATE_DEPTH":

      return updateDepth(state, action)

    default:
      return state
  }
}

export default reducer

