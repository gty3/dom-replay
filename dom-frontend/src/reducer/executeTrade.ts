import { getProfit } from "../lib/functions"
import { initialState } from "../App"

type PartialState = Partial<typeof initialState>

const executeTrade = (
  state: typeof initialState,
  tradePrice: number,
  tradeType: "B" | "S"
): PartialState => {
  const isNotInMarket = state.trade.side === ""
  const isClosingTrade = state.trade.side === (tradeType === "B" ? "S" : "B")
  const orderType = tradeType === "B" ? "bidLimitOrder" : "offerLimitOrder"

  const PNLChange = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: 10000000,
  })
  if (isNotInMarket) {
    return {
      trade: {
        price: tradePrice,
        side: tradeType,
      },
      [orderType]: null,
    }
  }

  if (isClosingTrade) {
    return {
      trade: {
        price: null,
        side: "",
      },
      PNL: state.PNL + PNLChange,
      [orderType]: null,
    }
  }

  return {}
}

export default executeTrade
