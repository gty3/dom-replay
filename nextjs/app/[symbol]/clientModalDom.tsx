
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
  
  return (
    <>
      <div className="mb-4 ml-4">
        <ModalButton symbol={symbol} start={start}/>
      </div>
      <div>
        <Dom
          exchange="GLBX.MDP3"
          instrument={symbol}
          start={start}
          increment={increment}
        />
      </div>
    </>
  )
}
