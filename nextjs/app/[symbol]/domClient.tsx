"use client"
import PriceRow from "./priceRow/priceRow"
// import AccountValue from "./accountValue"
import { useCallback, useReducer } from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"
import { State } from "../types"

export default function Dom({
  instrument,
  start,
  exchange,
  // increment,
  initialState
}: {
  instrument: string
  start: Date
  exchange: string
  // increment: number
  initialState: State
}) {


  const [state, dispatch] = useReducer(reducer, initialState)

  const memoizedDispatch = useCallback(dispatch, [dispatch]);

  useWebSocketConnection(exchange, instrument, start, memoizedDispatch);
  useDomScroll(initialState.increment, memoizedDispatch);

  // const profit = getProfit({
  //   bids: state.bids,
  //   offers: state.offers,
  //   trades: state.trade,
  //   increment: increment
  // })

  return (
    <>
      <div className="w-80">
        {state.prices.map((number: string, i: number) => (
          <PriceRow state={state} dispatch={memoizedDispatch} key={i} number={number} />
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