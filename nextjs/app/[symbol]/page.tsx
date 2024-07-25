"use client"
import Dom from "./dom"
import ModalButton from "./modal"
import definitions from "./definitions"


async function Page({
  params,
  searchParams,
}: {
  params: { symbol?: string }
  searchParams: { [key: string]: string | undefined }
}) {
  console.log("main page renders?")
  /* page should autoforward, this should not be possible? */
  if (!params.symbol) {
    return <div>No instrument</div>
  }
  if (!searchParams.start) {
    return <div>No start time</div>
  }
  const instrument = params.symbol
  // TODO: change this to have a default fail safe if no searchparams wrong? Why am I still
  // getting an error with the above handling?
  const startTime = new Date(searchParams.start)

  // const { min_price_increment } = definitions[instrument]

  const initialState = {
    PNL: 0,
    trade: {
      price: null as number | null,
      side: "",
    },
    prices: [] as string[],
    bids: {} as Record<string, number>,
    offers: {} as Record<string, number>,
    lowest: "",
    highest: "",
    marketBuys: {} as Record<string, number>,
    marketSells: {} as Record<string, number>,
    bidLimitOrder: null as number | null,
    offerLimitOrder: null as number | null,
    instrument: instrument,
    increment: 10000000
  }

  return (
    <div className="flex flex-col items-center mt-5">
      <div className="mb-4 ml-4">
        <ModalButton symbol={instrument} start={startTime} />
      </div>
      <div>
        <Dom
          exchange="GLBX.MDP3"
          instrument={instrument}
          start={startTime}
          initialState={initialState}
        />
      </div>
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(definitions).map((symbol) => ({
    symbol: symbol,
  }))
}

export default Page