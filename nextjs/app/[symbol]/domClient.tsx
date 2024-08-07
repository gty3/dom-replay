"use client"
import PriceRow from "./priceRow/priceRow"
// import AccountValue from "./accountValue"
import { useCallback, useEffect, useReducer, useState } from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"
import { State } from "../types"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
// import getLowestValue from "./utils/lowest"
// import getHighestValue from "./utils/highest"

export default function Dom({
  instrument,
  start,
  exchange,
  // increment,
  initialState,
}: {
  instrument: string
  start: Date
  exchange: string
  // increment: number
  initialState: State
}) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [currentSocketState, setCurrentSocketState] = useState(true)
  const memoizedDispatch = useCallback(dispatch, [dispatch])

  const pathname = usePathname()
  const queryParams = useSearchParams()
  const startParamEncoded = queryParams.get("start") ?? ""
  const startParam = decodeURI(startParamEncoded)
  const router = useRouter()

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const currentStart = new Date(startParam)
  //     const newStart = new Date(currentStart.getTime() + 1000)
  //     const newStartParam = encodeURI(newStart.toISOString())
  //     const newQueryParams = new URLSearchParams(queryParams.toString())
  //     newQueryParams.set("start", newStartParam)
  //     router.replace(`${pathname}?${newQueryParams.toString()}`)
  //   }, 1000)

  //   return () => clearInterval(interval)
  // }, [pathname, queryParams, startParam, router])

  useWebSocketConnection(
    exchange,
    instrument,
    start,
    memoizedDispatch,
    currentSocketState
  )

  useDomScroll(initialState.increment, memoizedDispatch)

  // const profit = getProfit({
  //   bids: state.bids,
  //   offers: state.offers,
  //   trades: state.trade,
  //   increment: state.increment,
  //   minPrice: state.minPrice
  // })

  return (
    <>
      <div className="w-80">
        {state.prices.map((number: string, i: number) => (
          <PriceRow
            state={state}
            dispatch={memoizedDispatch}
            key={i}
            number={number}
          />
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

// const getProfit = ({
//   bids,
//   offers,
//   trades,
//   increment,
//   minPrice
// }: ProfitProps): number => {
//   if (!increment) {
//     return 0
//   }
//   if (!trades.price || !bids || !offers || trades.side === "") {
//     return 0
//   }

//   const lowest = getLowestValue(offers)
//   const highest = getHighestValue(bids)

//   if (trades.side === "S" && lowest) {
//     console.log(trades.price, lowest)
//     const profit = trades.price - lowest
//     const profitTick = profit / increment
//     return profitTick * minPrice
//   } else if (trades.side === "B" && highest) {
//     const profit = highest - trades.price
//     const profitTick = profit / increment
//     return profitTick * minPrice
//   } else {
//     return 0
//   }
// }
