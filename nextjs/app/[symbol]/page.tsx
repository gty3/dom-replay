function Page({ params }: { params: any }) {
  // Access the dynamic part of the URL

  const sendPostRequest = async () => {
    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? "") +
          "/definition/" +
          params.symbol ,
          // +
          // "?start=2024-05-01T14:00:00Z",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, ${
            process.env.NEXT_PUBLIC_API_URL ??
            "" + "/definition/" + params.symbol
          }`
        )
      }

      const data = await response.json()
      console.log("Response data:", data)
    } catch (error) {
      console.error(
        "Error sending request:",
        process.env.NEXT_PUBLIC_API_URL + "/definition/" + params.symbol
      )
    }
  }
  sendPostRequest()

  return (
    <div>
      <p>Data: {JSON.stringify(params)}</p>
    </div>
  )
}

export default Page
