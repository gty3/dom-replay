
import { State } from "../../types"

type PartialState = Partial<State>

const executeTrade = (
  state: State,
  tradePrice: number,
  tradeType: "B" | "S"
): PartialState => {
  const isNotInMarket = state.trade.side === ""
  const isClosingTrade = state.trade.side === (tradeType === "B" ? "S" : "B")
  const orderType = tradeType === "B" ? "bidLimitOrder" : "offerLimitOrder"

  // const PNLChange = getProfit({
  //   bids: state.bids,
  //   offers: state.offers,
  //   trades: state.trade,
  //   increment: 10000000,
  // })
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
      // PNL: state.PNL + PNLChange,
      [orderType]: null,
    }
  }

  return {}
}

export default executeTrade

// interface ProfitProps {
//   bids: typeof state.bids
//   offers: typeof state.offers
//   trades: typeof state.trade
//   increment: number | null
// }

// const getProfit = ({
//   bids,
//   offers,
//   trades,
//   increment,
// }: ProfitProps): number => {
//   if (!increment) {
//     return 0
//   }
//   if (!trades.price || !bids || !offers || trades.side === "") {
//     return 0
//   }
//   const { lowest: lowestOffer } = getLowestHighest(offers)
//   const { highest: highestBid } = getLowestHighest(bids)

//   let profitTimesTick = 0
//   let profit: number | null = 0
  
//   if (trades.side === "S" && lowestOffer) {
//     profit = trades.price - lowestOffer
//     const profitTick = profit / calculateIncrements(bids)[1]
//     profitTimesTick = profitTick * increment
//   } else if (trades.side === "B" && highestBid) {
//     profit = highestBid - trades.price
//     const profitTick = profit / calculateIncrements(bids)[1]
//     profitTimesTick = profitTick * increment
//   }
//   return profitTimesTick
// }