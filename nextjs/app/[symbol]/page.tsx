import ClientModalDom from "./clientModalDom"

async function Page({
  params,
  searchParams,
}: {
  params: { symbol: string }
  searchParams: { [key: string]: string | undefined }
}) {
  const getDefinitions = async (instrument: string, startTime: Date) => {
    const definitionsUrl = new URL(process.env.NEXT_PUBLIC_API_URL + "/definitions");
    definitionsUrl.searchParams.append("instrument", instrument);
    definitionsUrl.searchParams.append("start", startTime.toISOString());

    const response = await fetch(definitionsUrl.toString(), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });
    return response.json();
  };

  const startTime = new Date(searchParams.start ?? "");
  const instrument = params.symbol;

  const res = await getDefinitions(instrument, startTime);


  return (
      <div className="flex flex-col items-center mt-5">
        <ClientModalDom
          symbol={params.symbol}
          start={startTime}
          increment={res.min_price_increment}
        />
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
