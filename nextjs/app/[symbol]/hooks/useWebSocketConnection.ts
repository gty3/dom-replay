"use client"
import { useCallback, useEffect } from "react"
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
  const subscribeToData = useCallback(() => {
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
  }, [readyState, sendJsonMessage, start, instrument, exchange])

  function isPriceArrayMessage(
    message: unknown
  ): message is { price_array: number[]; time: number } {
    if (!message || typeof message !== "object") return false
    const msg = message as { price_array?: number[]; time?: number }
    return (
      Array.isArray(msg.price_array) &&
      msg.price_array.every((item) => typeof item === "number") &&
      typeof msg.time === "number"
    )
  }

  function isMBO(message: unknown): message is MBO {
    if (!message) return false
    return (message as MBO).hd?.rtype === 160
  }
  function isMBP10(message: unknown): message is MBP10 {
    if (!message) return false
    return (message as MBP10).hd?.rtype === 10
  }

  useEffect(() => {
    subscribeToData()
  }, [readyState, sendJsonMessage, subscribeToData])

  useEffect(() => {
    if (isPriceArrayMessage(lastJsonMessage)) {
      const { price_array, time } = lastJsonMessage
      dispatch({
        type: "UPDATE_PRICE_ARRAY",
        payload: {
          priceArray: price_array,
          time: time,
        },
      })
    }
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

      // if (datasetTime.getTime() !== start.getTime()) {
      //   // console.log("wrong dataset time", datasetTime, start)
      //   return
      // } else {
        dispatch({
          type: "UPDATE_DEPTH",
          payload: {
            MBP10: mbp10,
          },
        })
      // }
    }
  }, [lastJsonMessage, dispatch, start])
}

function convertDateString(dateString: string): string {
  // Remove the extra ":00" from the timezone offset
  return dateString.replace(/(\+\d{2}:\d{2}):\d{2}$/, "$1")
}

export default useWebSocketConnection
