import { getProfit } from "@/app/lib/functions"
import { initialState } from "../app"
import { instruments } from "../instrumentList"
import getInstrumentCode from "../utils/getInstrumentCode"

type PartialState = Partial<typeof initialState>

const executeTrade = (
  state: typeof initialState,
  tradePrice: number,
  tradeType: "B" | "S"
): PartialState => {
  const isNotInMarket = state.trade.side === ""
  const isClosingTrade = state.trade.side === (tradeType === "B" ? "S" : "B")
  const orderType = tradeType === "B" ? "bidLimitOrder" : "offerLimitOrder"
  // console.log('trade fired', tradePrice, tradeType)

  const instrumentCode = getInstrumentCode(state.instrument)
  const PNLChange = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: instruments[instrumentCode].pricePerTick,
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
