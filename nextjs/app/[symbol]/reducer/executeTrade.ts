
import { ProfitProps, State } from "../../types"
import getHighestValue from "../utils/highest"
import getLowestValue from "../utils/lowest"

type PartialState = Partial<State>

const executeTrade = (
  state: State,
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

const getProfit = ({
  bids,
  offers,
  trades,
  increment,
}: ProfitProps): number => {
  if (!increment) {
    return 0
  }
  if (!trades.price || !bids || !offers || trades.side === "") {
    return 0
  }

  const lowest = getLowestValue(offers)
  const highest = getHighestValue(bids)

  if (trades.side === "S" && lowest) {
    const profit = trades.price - lowest
    const profitTick = profit / increment
    return profitTick * increment
  } else if (trades.side === "B" && highest) {
    const profit = highest - trades.price
    const profitTick = profit / increment
    return profitTick * increment
  } else {
    return 0
  }
}