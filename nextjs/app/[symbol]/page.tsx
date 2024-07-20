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
  /* page should autoforward, this should not be possible? */
  if (!params.symbol) {
    return <div>No instrument</div>
  }
  if (!searchParams.start) {
    return <div>No start time</div>
  }
  const instrument = params.symbol
  const startTime = new Date(searchParams.start)

  // const { min_price_increment } = definitions[instrument]

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
          increment={10000000}
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