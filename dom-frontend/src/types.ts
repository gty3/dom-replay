interface Header {
  length: number
  rtype: number
  publisher_id: number
  instrument_id: number
  ts_event: number
}

interface Level {
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
}

export interface MBO {
  hd: Header
  order_id: number;
  price: number;
  size: number;
  flags: number;
  channel_id: number;
  action: number;
  side: number;
  ts_recv: number;
  ts_in_delta: number;
  sequence: number;
}

export interface InstrumentFile {
  depth: string
  trades: string
  increment: number
  ohlc: string
}

export type FlatOhlcData = {
  close: string
  high: string
  instrument_id: string
  low: string
  open: string
  publisher_id: string
  rtype: string
  ts_event: string
  volume: string
}

export interface BidsOffersTime {
  offers: Record<string, number>
  bids: Record<string, number>
  ts_event?: Date
}

export type ReducerAction =
  | { type: "UPDATE_MBO"; payload: MBO }
  | { type: "SELECT_INSTRUMENT"; payload: string }
  | { type: "BUY_SELL_AGG" }
  | { type: "BID_LIMIT"; payload: number }
  | { type: "SELL_LIMIT"; payload: number }
  | { type: "SCROLL_DOWN" }
  | { type: "SCROLL_UP" }
  | { type: "UPDATE_DEPTH"; payload: MBP10 }

export interface NowAggRecords {
  now: Record<string, number>
  agg: Record<string, number>
}