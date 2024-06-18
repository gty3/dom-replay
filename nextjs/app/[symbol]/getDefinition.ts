const getDefinition = async (symbol: string, startTime: string) => {
  try {
    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_URL ?? "") + "/definition/" + symbol,
      // +
      // "?start=2024-05-01T14:00:00Z",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    const data = await response.json()
    console.log("Response data:", data)
  } catch (error) {
    console.error("Error sending request:")
  }
}

export default getDefinition
