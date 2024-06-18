import Dom from "./dom"
import getDefinition from "./getDefinition"
import ModalButton from "./modal"
import { Button } from "@/components/ui/button"

function Page({
  params,
  searchParams,
}: {
  params: { symbol: string }
  searchParams: { [key: string]: string | undefined }
}) {
  // Access the dynamic part of the URL
  console.log(searchParams.start)

  getDefinition(params.symbol, "2024-05-01T14:00:00Z")
  return (
    <div>
      <div className="mt-4 mb-3 ml-4">
        {" "}
        {/* <Button>
        {params.symbol} {searchParams.start}
      </Button> */}
      </div>
      <div className="mb-4 ml-4">
        <ModalButton
          symbol={params.symbol}
          start={new Date("2024-05-01T14:00:00Z")}
        />
      </div>
      <div>
        <Dom
          exchange="CME"
          instrument={params.symbol}
          start={new Date("2024-05-01T14:00:00Z")}
          prices={[]}
          increment={10}
        />
      </div>
    </div>
  )
}

export default Page

export async function generateStaticParams() {
  const definitionsUrl = process.env.NEXT_PUBLIC_API_URL + "/definitions"
  const symbols = await fetch(definitionsUrl).then((res) => res.json())
  console.log(symbols)
  return symbols.map((symbol: { symbol: string }) => ({
    symbol: symbol.symbol,
  }))
}
