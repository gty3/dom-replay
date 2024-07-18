"use client"
import { useCallback, useEffect } from "react"
import { Dispatch } from "react"
import { ReducerAction, MBO, MBP10, BidOffer } from "../../types"
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


  
  interface PriceArrayMessage {
    price_array: number[];
    time: number;
    bids: BidOffer[];
    offers: BidOffer[];
  }
  
  function isPriceArrayMessage(message: unknown): message is PriceArrayMessage {
    if (typeof message !== "object" || message === null) return false;
    const msg = message as PriceArrayMessage;
    return (
      Array.isArray(msg.price_array) &&
      msg.price_array.every((item) => typeof item === "number") &&
      typeof msg.time === "number" &&
      Array.isArray(msg.bids) &&
      msg.bids.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof item.price === "number" &&
          typeof item.size === "number"
      ) &&
      Array.isArray(msg.offers) &&
      msg.offers.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof item.price === "number" &&
          typeof item.size === "number"
      )
    );
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
    return () => {
      unsubscribeToData()
    }
  }, [readyState, sendJsonMessage, subscribeToData, unsubscribeToData])

  useEffect(() => {
    // console.log('lastJsonMessage', lastJsonMessage)
    if (isPriceArrayMessage(lastJsonMessage)) {
      const { price_array, time, bids, offers } = lastJsonMessage
      console.log("update price array:", price_array, bids, offers)
      dispatch({
        type: "UPDATE_PRICE_ARRAY",
        payload: {
          priceArray: price_array,
          time: time,
          bids,
          offers
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
      console.log(mbp10)
      // const datasetTime = new Date(convertDateString(mbp10.dataset_time))

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
