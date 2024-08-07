"use client"
import PriceRow from "./priceRow/priceRow"
import AccountValue from "./accountValue"
import { useCallback, useReducer} from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"
import { ProfitProps, State } from "../types"
import getLowestValue from "./utils/lowest"
import getHighestValue from "./utils/highest"

export default function Dom({
  instrument,
  start,
  exchange,
  initialState,
  currentSocketState,
}: {
  instrument: string
  start: Date
  exchange: string
  initialState: State
  currentSocketState: boolean
  
}) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const memoizedDispatch = useCallback(dispatch, [dispatch])

  useWebSocketConnection(
    exchange,
    instrument,
    start,
    memoizedDispatch,
    currentSocketState
  )

  useDomScroll(initialState.increment, memoizedDispatch)

  const profit = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: state.increment,
    minPrice: state.minPrice,
  })

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
        <AccountValue
          side={state.trade.side}
          profit={profit}
          accountValue={state.PNL}
        ></AccountValue>
      </div>
    </>
  )
}

const getProfit = ({
  bids,
  offers,
  trades,
  increment,
  minPrice
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
