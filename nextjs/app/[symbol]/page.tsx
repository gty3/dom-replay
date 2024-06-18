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
  console.log(searchParams.start)

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
          prices={[]}
          increment={10}
        />
      </div>
    </div>
  )
}

export default Page

export async function generateStaticParams() {
  const definitionsUrl = process.env.NEXT_PUBLIC_API_URL + "/definitions";
  console.log(definitionsUrl);
  try {
    const response = await fetch(definitionsUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const symbols = await response.json();
    console.log("response", symbols);
    return symbols; // Assuming you want to return the fetched data
  } catch (error) {
    console.error("Error fetching data: ", error);
    return []; // Return an empty array in case of error
  }
}