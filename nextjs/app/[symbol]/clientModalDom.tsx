
"use client"
import { useState } from "react"
import Dom from "./dom"
import ModalButton from "./modal"

export default function ClientModalDom({
  symbol,
  start,
  increment,

}: {
  symbol: string
  start: Date
  increment: number
}) {

  const [priceArray, setPriceArray] = useState<string[]>([])
  const [isWebSocketActive, setIsWebSocketActive] = useState(true)

  const updatePriceArray = (newPrices: string[]) => {
    setIsWebSocketActive(false)
    // setPriceArray(newPrices)
  }
  
  const handleNewDataReceived = () => {
    setIsWebSocketActive(true)
  }
  
  return (
    <>
      <div className="mb-4 ml-4">
        <ModalButton symbol={symbol} start={start} setPriceArray={setPriceArray} updatePriceArray={updatePriceArray} />
      </div>
      <div>
        <Dom
          exchange="GLBX.MDP3"
          instrument={symbol}
          start={start}
          prices={priceArray}
          increment={increment}
          updatePriceArray={updatePriceArray}
          isWebSocketActive={isWebSocketActive}
          onNewDataReceived={handleNewDataReceived}
        />
      </div>
    </>
  )
}
