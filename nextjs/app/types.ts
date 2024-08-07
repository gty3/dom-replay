interface Header {
  length: number
  rtype: number
  publisher_id: number
  instrument_id: number
  ts_event: number
}

export interface Level {
  bid_px: number
  ask_px: number
  bid_sz: number
  ask_sz: number
  bid_ct: number
  ask_ct: number
}

export interface MBP10 {
  hd: Header
  price: number
  size: number
  action: number
  side: number
  flags: number
  depth: number
  ts_recv: number
  ts_in_delta: number
  sequence: number
  levels: Level[]
  initial?: boolean
  dataset_time: string
}

export interface MBO {
  hd: Header
  order_id: number
  price: number
  size: number
  flags: number
  channel_id: number
  action: number
  side: number
  ts_recv: number
  ts_in_delta: number
  sequence: number
}

export interface InstrumentFile {
  depth: string
  trades: string
  increment: number
  ohlc: string
}
export interface BidsOffersTime {
  offers: Record<string, number>
  bids: Record<string, number>
  ts_event?: Date
}

export type ReducerAction =
  | {
      type: "UPDATE_DEPTH"
      payload: {
        MBP10: MBP10
      }
    }
  | {
      type: "UPDATE_INITIAL"
      payload: MBP10
    }
  | { type: "BID_LIMIT"; payload: number }
  | { type: "SELL_LIMIT"; payload: number }
  | { type: "SCROLL_DOWN"; payload: number }
  | { type: "SCROLL_UP"; payload: number }

export interface NowAggRecords {
  now: Record<string, number>
  agg: Record<string, number>
}

export interface State {
  PNL: number
  trade: {
    price: number | null
    side: number
  }
  prices: string[]
  bids: Record<string, number>
  offers: Record<string, number>
  lowest: string
  highest: string
  marketBuys: Record<string, number>
  marketSells: Record<string, number>
  bidLimitOrder: number | null
  offerLimitOrder: number | null
  instrument: string
  increment: number
  loading: boolean
  minPrice: number
}

export interface BidOffer {
  price: number
  size: number
}
export interface ProfitProps {
  bids: Record<string, number>
  offers: Record<string, number>
  trades: {
    price: number | null
    side: number
  }
  increment: number | null
  minPrice: number
}
