import { initialState } from "../../state"
import { priceDecimalFn } from "../../lib/functions"
import Depth from "./depth"
import Price from "./price"
import { useCallback } from "react"
import { getLowestHighest } from "../../utils/getLowestHighest"
import { ReducerAction } from "../../types"
export const PriceRow = ({
  state,
  dispatch,
  number: priceNumber,
}: {
  state: typeof initialState
  dispatch: React.Dispatch<ReducerAction>
  number: number
}) => {
  const limitOrder =
    state.bidLimitOrder === priceNumber
      ? "B"
      : state.offerLimitOrder === priceNumber
      ? "S"
      : ""

  const priceLength = 2
  const decimalPrice = priceDecimalFn(priceNumber)
  const fixedString = decimalPrice.toFixed(priceLength)

  const bidClick = useCallback(() => {
    dispatch({ type: "BID_LIMIT", payload: priceNumber })
  }, [dispatch, priceNumber])

  const offerClick = useCallback(() => {
    dispatch({ type: "SELL_LIMIT", payload: priceNumber })
  }, [dispatch, priceNumber])

  const borderColor =
    state.trade.side === "B" ? "border-blue-500" : "border-red-500"
  const tradeBorder =
    priceNumber === Number(state.trade.price)
      ? `border-[3px] -ml-2.5 pl-5 -mr-1.5 relative z-20 ${borderColor}`
      : "border-[3px] -m-1.5 pl-4 border-transparent"

      const { lowest } = getLowestHighest(state.offers)
      const { highest } = getLowestHighest(state.bids)
      const higher = highest !== null && priceNumber > highest + 10000000
      const lower = lowest !== null && priceNumber < lowest - 10000000

  return (
    <div className={`grid grid-flow-col ${tradeBorder}`}>
      <Price fixedStringPrice={fixedString} />
      <Depth
        limits={state.bids[priceNumber]}
        limitOrder={limitOrder}
        higherLower={higher}
        onClick={bidClick}
        isBid={true}
      />
    
      <div className="flex relative flex-row -ml-4">
        <div className={`absolute right-0 mr-1 text-red-500`}>
          {state.marketSells[priceNumber]}
        </div>
      </div>
      <div className="flex relative flex-row mr-2">
        <div className={`ml-1 w-4 text-blue-500`}>
          {state.marketBuys[priceNumber]}
        </div>
      </div>

      <Depth
        limits={state.offers[priceNumber]}
        limitOrder={limitOrder}
        onClick={offerClick}
        higherLower={lower}
        isBid={false}
      />
    </div>
  )
}

export default PriceRow
