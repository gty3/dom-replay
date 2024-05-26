import { instrument } from "./instrument"

export const initialState = {
  PNL: 0,
  trade: {
    price: null as number | null,
    side: "",
  },
  prices: instrument.array,
  bids: {} as Record<string, number>,
  offers: {} as Record<string, number>,
  marketBuys: {} as Record<string, number>,
  marketSells: {} as Record<string, number>,
  bidLimitOrder: null as number | null,
  offerLimitOrder: null as number | null,
  instrument: instrument.name,
}