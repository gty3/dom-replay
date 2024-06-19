import Dom from "./dom"
import ModalButton from "./modal"

function Page({
  params,
  searchParams,
}: {
  params: { symbol: string }
  searchParams: { [key: string]: string | undefined }
}) {
  // Access the dynamic part of the URL
  console.log("FFFF", params)

  const getDefinitions = async () => {
    const definitionsUrl = process.env.NEXT_PUBLIC_API_URL + "/definitions";
    const response = await fetch(definitionsUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }

    });
    console.log("res", await response.json())
  }
  getDefinitions()

  const priceArray = Array.from({ length: 18 }, (_, i) => 7791 - i * 10)

  return (
    <div>
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
          prices={priceArray}
          increment={10}
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