"use client"
import { useCallback, useEffect } from "react"
import { Dispatch } from "react"
import { ReducerAction, MBP10, BidOffer } from "../../types"
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
      shouldReconnect: () => false,
      onOpen: () => {
        sendJsonMessage({
          event: "unsubscribe",
          data: {
            exchange: exchange,
            instrument: instrument,
          },
        })
      }
    }
  )
  const subscribeToData = useCallback(() => {
    console.log("readyState", readyState)
    if (readyState === ReadyState.OPEN && instrument) {
      "send subscribe"
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
  
  const unsubscribeToData = useCallback(() => {
    if (readyState === ReadyState.OPEN && instrument) {
      sendJsonMessage({
        event: "unsubscribe",
        data: {
          exchange: exchange,
          instrument: instrument,
        },
      })
    }
  }, [readyState, sendJsonMessage, instrument, exchange])
  
  // console.log("how many renders")
  
  useEffect(() => {
    subscribeToData()
    return () => {
      unsubscribeToData()
    }
  }, [readyState, sendJsonMessage, subscribeToData, unsubscribeToData])

  useEffect(() => {
    if (!lastJsonMessage) return
    function isMBP10(message: unknown): message is MBP10 {
      if (!message) return false
      return (message as MBP10).hd?.rtype === 10
    }
  
    // console.log('lastJsonMessage', lastJsonMessage)
    if (isMBP10(lastJsonMessage)) {
      // console.log("isMBP10", lastJsonMessage)
      const mbp10 = lastJsonMessage
      if (mbp10.initial) {
        console.log('dispatch calla')
        dispatch({
          type: "UPDATE_INITIAL",
          payload: mbp10
        })
        // console.log("initial MBP10", mbp10)
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

export default useWebSocketConnection

