
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
  console.log(state.trade.side, tradeType)
  const isClosingTrade = state.trade.side === (tradeType === 65 ? 66 : 65)
  const orderType = tradeType === 66 ? "bidLimitOrder" : "offerLimitOrder"

  const PNLChange = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: state.increment,
    minPrice: state.minPrice,
  })
  if (isNotInMarket) {
    console.log("isNotInMarket")
    return {
      trade: {
        price: tradePrice,
        side: tradeType,
      },
      [orderType]: null,
    }
  }

  if (isClosingTrade) {
    console.log("closing trade",state.PNL + PNLChange)
    return {
      trade: {
        price: null,
        side: 0,
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
  if (!trades.price || !bids || !offers || !trades.side) {
    return 0
  }

  const lowest = getLowestValue(offers)
  const highest = getHighestValue(bids)

  if (trades.side === 65 && lowest) {
    const profit = trades.price - lowest
    const profitTick = profit / increment
    return profitTick * minPrice
  } else if (trades.side === 66 && highest) {
    const profit = highest - trades.price
    const profitTick = profit / increment
    return profitTick * minPrice
  } else {
    return 0
  }
}