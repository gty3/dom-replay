"use client"
import { useCallback, useEffect } from "react"
import { Dispatch } from "react"
import { ReducerAction, MBP10 } from "../../types"
import useWebSocket, { ReadyState } from "react-use-websocket"

const useWebSocketConnection = (
  exchange: string,
  instrument: string | null,
  start: Date,
  dispatch: Dispatch<ReducerAction>,
  socketState: boolean
) => {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL ?? "",
    {
      share: false,
      shouldReconnect: () => false,
    },
    // set 3rd arg to false to disconnect
    socketState
  )

  const subscribeToData = useCallback(() => {
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
  
  
  useEffect(() => {
    subscribeToData()
    // return () => {
    //   subscribeToData()
    // }
  }, [readyState, sendJsonMessage, subscribeToData])

  useEffect(() => {
    if (!lastJsonMessage) return
    function isMBP10(message: unknown): message is MBP10 {
      if (!message) return false
      return (message as MBP10).hd?.rtype === 10
    }
  
    if (isMBP10(lastJsonMessage)) {
      const mbp10 = lastJsonMessage
      if (mbp10.initial) {
        console.log('dispatch calla')
        dispatch({
          type: "UPDATE_INITIAL",
          payload: mbp10
        })
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

