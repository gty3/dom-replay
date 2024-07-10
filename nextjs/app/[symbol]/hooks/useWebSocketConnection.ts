import { useEffect } from "react"
import { Dispatch } from "react"
import { ReducerAction, MBO, MBP10 } from "../../types"
import useWebSocket, { ReadyState } from "react-use-websocket"

const useWebSocketConnection = (
  exchange: string,
  instrument: string | null,
  start: Date,
  dispatch: Dispatch<ReducerAction>
) => {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL ?? "",
    {
      share: false,
      shouldReconnect: () => true,
    }
  )
  

  function isMBO(message: unknown): message is MBO {
    return (message as MBO).hd?.rtype === 160
  }
  function isMBP10(message: unknown): message is MBP10 {
    return (message as MBP10).hd?.rtype === 10
  }

  useEffect(() => {
    if (readyState === ReadyState.OPEN && instrument) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          exchange: exchange,
          instrument: instrument,
          replay_time: start.toISOString(),
        },
      })
    }

    return () => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({ event: "unsubscribe" })
      }
    }
  }, [readyState, sendJsonMessage, start, instrument, exchange])

  useEffect(() => {

    console.log(lastJsonMessage)
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
      const datasetTime = new Date(convertDateString(mbp10.dataset_time))

      if (mbp10.isFirstMessage) {
        dispatch({
          type: "UPDATE_PRICE_ARRAY",
          payload: {
            MBP10: mbp10,
          },
        })
      } else if (datasetTime.getTime() !== start.getTime()) {
        console.log("wrong dataset time", datasetTime, start)
        return
      } else {
        dispatch({
          type: "UPDATE_DEPTH",
          payload: {
            MBP10: mbp10,
          },
        })
      }
    }
  }, [lastJsonMessage, dispatch])
}

function convertDateString(dateString: string): string {
  // Remove the extra ":00" from the timezone offset
  return dateString.replace(/(\+\d{2}:\d{2}):\d{2}$/, '$1')
}

export default useWebSocketConnection
