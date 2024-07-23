import dynamic from 'next/dynamic'

const DomClient = dynamic(() => import('./domClient'), { 
  ssr: false,
  loading: () => <p>Loading DOM...</p> // Optional loading state
})

export default function Dom(props: any) {
  return <DomClient {...props} />
}