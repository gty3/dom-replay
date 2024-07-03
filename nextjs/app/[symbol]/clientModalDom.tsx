
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

  const updatePriceArray = (newPrices: string[]) => {
    setPriceArray(newPrices)
  }
  
  return (
    <>
      <div className="mb-4 ml-4">
        <ModalButton symbol={symbol} start={start} setPriceArray={setPriceArray} />
      </div>
      <div>
        <Dom
          exchange="GLBX.MDP3"
          instrument={symbol}
          start={start}
          prices={priceArray}
          increment={increment}
          updatePriceArray={updatePriceArray}
        />
      </div>
    </>
  )
}
