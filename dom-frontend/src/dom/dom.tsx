import PriceRow from "./priceRow/priceRow"
import { getProfit } from "../lib/functions"
import AccountValue from "./accountValue"
import { initialState } from "../App"
import { ReducerAction } from "../types"



export default function Dom({
  dispatch,
  state,
}: {
  state: typeof initialState
  dispatch: (action: ReducerAction) => void
}) {

  const profit = getProfit({
    bids: state.bids,
    offers: state.offers,
    trades: state.trade,
    increment: 10000000,
  })

  return (
    <>
      <div className="w-80">
        {state.prices.map((number, i) => (
          <PriceRow state={state} dispatch={dispatch} key={i} number={number} />
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
