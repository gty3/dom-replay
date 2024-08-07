"use client"
import dynamic from 'next/dynamic'
import { State } from '../types'
import ModalButton from './modal'
import { useState } from 'react'

interface DomProps {
  instrument: string
  start: Date
  exchange: string
  initialState: State
}

const DomClient = dynamic(() => import('./domClient'), { 
  ssr: false,
  loading: () => <p>Loading DOM...</p> // Optional loading state
})

export default function Dom(props: DomProps) {

  const [currentSocketState, setCurrentSocketState] = useState(true)

  const key = `${props.instrument}-${props.start.toISOString()}`
  return (
    <>
      {" "}
      <div className="mb-4 ml-4">
        <ModalButton
          symbol={props.instrument}
          start={props.start}
          setCurrentSocketState={setCurrentSocketState}
        />
      </div>
      <DomClient {...props} currentSocketState={currentSocketState} key={key} />
    </>
  )
}