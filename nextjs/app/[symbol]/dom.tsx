import dynamic from 'next/dynamic'
import { State } from '../types'

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
  return <DomClient {...props} />
}