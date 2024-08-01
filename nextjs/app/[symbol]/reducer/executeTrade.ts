
import { ProfitProps, State } from "../../types"
import getHighestValue from "../utils/highest"
import getLowestValue from "../utils/lowest"

type PartialState = Partial<State>

const executeTrade = (
  state: State,
  tradePrice: number,
  tradeType: 65 | 66
): PartialState => {
  const isNotInMarket = !state.trade.side
  const isClosingTrade = state.trade.side === (tradeType === 65 ? 66 : 65)
  const orderType = tradeType === 65 ? "bidLimitOrder" : "offerLimitOrder"

  const PNLChange = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: state.increment,
    minPrice: state.minPrice,
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
    console.log(state.PNL + PNLChange)
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
  minPrice,
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
    return profitTick * minPrice
  } else if (trades.side === "B" && highest) {
    const profit = highest - trades.price
    const profitTick = profit / increment
    return profitTick * minPrice
  } else {
    return 0
  }
}