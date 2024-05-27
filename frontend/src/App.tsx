import { useMemo, useReducer } from "react"
import reducer from "./reducer/reducer"
import useWebSocketConnection from "./hooks/useWebSocketConnection"
import useDomScroll from "./hooks/useDomScroll"
import Dom from "./dom/dom"
import { initialState } from "./state"

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const WS_URL = import.meta.env.VITE_WS_URL

  /* recieve data */
  useWebSocketConnection(WS_URL, dispatch)

  /* use mouse scroll to move on the dom */
  useDomScroll(dispatch)

  const MemoizedDom = useMemo(
    () => <Dom dispatch={dispatch} state={state} />,
    [dispatch, state]
  )

  return <div className="flex justify-center mt-5">{MemoizedDom}</div>
}
