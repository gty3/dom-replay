import { useEffect } from "react"
import { Dispatch } from "react"
import { ReducerAction, MBO, MBP10 } from "../../types"
import useWebSocket, { ReadyState } from "react-use-websocket"

const useWebSocketConnection = (
  exchange: string,
  instrument: string | null,
  start: Date,
  dispatch: Dispatch<ReducerAction>,
) => {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL ?? "",
    {
      share: false,
      shouldReconnect: () => true,
    }
  )

  function isMBO(message: unknown): message is MBO {
    return (message as MBO).hd?.rtype === 160;
  }
  function isMBP10(message: unknown): message is MBP10 {
    return (message as MBP10).hd?.rtype === 10;
  }

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          exchange: exchange,
          instrument: "" + instrument,
          replay_time: "2024-06-10T14:00:00Z",
        },
      })
    }
  }, [readyState, sendJsonMessage])

  useEffect(() => {
    if (!lastJsonMessage || Object.keys(lastJsonMessage).length === 0) {
      return
    }
    /* if message is MBO */
    if (isMBO(lastJsonMessage)) {
      const mbo = lastJsonMessage
      /* if mbo.action === "T" */
      if (mbo.action === 84) {

        dispatch({ type: "UPDATE_MBO", payload: mbo })
      }

      /* if message is MBP10 */
    } else if (isMBP10(lastJsonMessage)) {
      const mbp10 = lastJsonMessage

      dispatch({ type: "UPDATE_DEPTH", payload: mbp10 })
    }

  }, [lastJsonMessage, dispatch])
}

export default useWebSocketConnection
