import Dom from "./dom"
import ModalButton from "./modal"
import definitions from "./definitions"


async function Page({
  params,
  searchParams,
}: {
  params: { symbol: string }
  searchParams: { [key: string]: string | undefined }
}) {
  const instrument = params.symbol
  const startTime = new Date(searchParams.start ?? "")

  const { min_price_increment } = definitions[instrument]

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
          increment={min_price_increment}
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