import { initialState } from "../state"
import { getLowestHighest } from "../utils/getLowestHighest"

const calculateIncrements = (bids: Record<string, number>): number[] => {
  const keys = Object.keys(bids)
    .map(Number)
    .sort((a, b) => a - b)
  const increments = keys.slice(1).map((key, i) => key - keys[i])
  return increments
}

export const getTimeSpent = (startTime: Date): number => {
  const currentTime = new Date()
  const timeSpent = currentTime.getTime() - startTime.getTime()
  const secondsSpent = Math.floor(timeSpent / 1000)
  return secondsSpent
}

export const roundToTwo = (number: number): number => {
  return +(Math.round(number * 1e2) / 1e2)
}

interface ProfitProps {
  bids: typeof initialState.bids
  offers: typeof initialState.offers
  trades: typeof initialState.trade
  increment: number | null
}

export const getProfit = ({
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
  const { lowest: lowestOffer } = getLowestHighest(offers)
  const { highest: highestBid } = getLowestHighest(bids)

  let profitTimesTick = 0
  let profit: number | null = 0
  
  if (trades.side === "S" && lowestOffer) {
    profit = trades.price - lowestOffer
    const profitTick = profit / calculateIncrements(bids)[1]
    profitTimesTick = profitTick * increment
  } else if (trades.side === "B" && highestBid) {
    profit = highestBid - trades.price
    const profitTick = profit / calculateIncrements(bids)[1]
    profitTimesTick = profitTick * increment
  }
  return profitTimesTick
}

export const priceDecimalFn = (input: string | number): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input
  const decimalPrice = num * 1e-9
  // TODO .toFixed number needs to be dynamic to account for multiple instruments
  // function used in priceRow is priceLength and is reliant on state
  const stringFixed = decimalPrice.toFixed(5)
  return Number(stringFixed)
}