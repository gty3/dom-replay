import { useMemo, useReducer } from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"
import Dom from "./dom/dom"

export const instrument = {
  name: "CLM4",
  priceTick: 10,
  array: Array.from({ length: 18 }, (_, i) => 77910000000 - i * 10000000),
}

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

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const WS_URL = import.meta.env.VITE_WS_URL ?? ""

  /* recieve data */
  useWebSocketConnection(WS_URL, dispatch)

  /* use mouse scroll to move on the dom */
  useDomScroll(dispatch)

  const MemoizedDom = useMemo(
    () => <Dom dispatch={dispatch} state={state} />,
    [dispatch, state]
  )

  return <div className="">{MemoizedDom}</div>
}
