"use client"
import PriceRow from "./priceRow/priceRow"
// import AccountValue from "./accountValue"
import { useEffect, useReducer, useState } from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"

export default function Dom({
  prices,
  instrument,
  start,
  exchange,
  increment,
  updatePriceArray
}: {
  prices: string[]
  instrument: string
  start: Date
  exchange: string
  increment: number
  updatePriceArray: (newPrices: string[]) => void
}) {

  const [state, dispatch] = useReducer(reducer, {
    PNL: 0,
    trade: {
      price: null as number | null,
      side: "",
    },
    prices: {
      // priceTime: null as Date | null,
      priceArray: prices,
    },
    bids: {} as Record<string, number>,
    offers: {} as Record<string, number>,
    lowest: "",
    highest: "",
    marketBuys: {} as Record<string, number>,
    marketSells: {} as Record<string, number>,
    bidLimitOrder: null as number | null,
    offerLimitOrder: null as number | null,
    instrument: instrument,
    increment: increment
  })

  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  useEffect(() => {
    dispatch({ type: "UPDATE_PRICE_ARRAY", payload: prices })
  }, [prices, updatePriceArray])

  useWebSocketConnection(exchange, instrument, start, dispatch, isUnsubscribing, setIsUnsubscribing)

  useDomScroll(increment, dispatch)

  // const profit = getProfit({
  //   bids: state.bids,
  //   offers: state.offers,
  //   trades: state.trade,
  //   increment: increment
  // })

  return (
    <>
      <div className="w-80">
        {state.prices.priceArray.map((number: string, i: number) => (
          <PriceRow state={state} dispatch={dispatch} key={i} number={number} />
        ))}
        {/* <AccountValue
          side={state.trade.side}
          profit={profit}
          accountValue={state.PNL}
        ></AccountValue> */}
      </div>
    </>
  )
}

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