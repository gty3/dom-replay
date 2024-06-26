import Dom from "./dom"
import ModalButton from "./modal"
import { initialPrices } from "./utils/prices"

async function Page({
  params,
  searchParams,
}: {
  params: { symbol: string }
  searchParams: { [key: string]: string | undefined }
}) {
  const getDefinitions = async () => {
    const definitionsUrl = process.env.NEXT_PUBLIC_API_URL + "/definitions"
    const response = await fetch(definitionsUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    })
    return response.json()
  }

  const res = await getDefinitions()

  const startTime = 
    new Date(searchParams.start ?? "")

  return (
      <div className="flex flex-col items-center mt-5">
        <div className="mb-4 ml-4">
          <ModalButton
            symbol={params.symbol + " " + searchParams.start}
            start={startTime}
          />
        </div>
        <div>
          <Dom
            exchange="GLBX.MDP3"
            instrument={"clq4"}
            start={startTime}
            prices={initialPrices}
            increment={res.min_price_increment}
          />
        </div>
      </div>
  )
}

export default Page

// export async function generateStaticParams() {
//   const definitionsUrl = process.env.NEXT_PUBLIC_API_URL + "/definitions";
//   console.log(definitionsUrl);
//   try {
//     const response = await fetch(definitionsUrl, {
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const symbols = await response.json();
//     Array.from({ length: 18 }, (_, i) => 77910000000 - i * 10000000)
//     console.log("response", symbols);
//     return symbols;
//   } catch (error) {
//     console.error("Error fetching data: ", error);
//     return []; // Return an empty array in case of error
//   }
// }
