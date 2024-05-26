
const Depth = ({
  limitOrder,
  onClick,
  isBid,
  limits,
  higherLower,
}: {
  limits: number
  higherLower: boolean
  limitOrder: string
  onClick: () => void
  isBid: boolean
}) => {

  const color = isBid ? "bg-blue-800" : "bg-red-800"
  // const leftOrRight = isBid ? "left-0" : "right-0"
  const rightOrLeft = isBid ? "right-0" : "left-0"

  const style =
    limitOrder === "B" && isBid
      ? ` outline outline-blue-500 pr-1.5 -ml-2 -mr-2 pl-1.5 w-20 mt-0 z-10 `
      : limitOrder === "S" && !isBid
      ? ` outline outline-red-600 pr-1.5 -ml-2 -mr-2 pl-1.5 w-20 mt-0 z-10 `
      : ` border-2 border-transparent ${color} `


  if (
    (higherLower)
  ) {
    return (
      <div className="relative w-16">
        <div className="flex items-center justify-center h-8 border-t " />
        <div className={`${rightOrLeft} bottom-0 absolute px-1.5 py-1 text-xs text-gray-300`}>
          {/* {aloLimitAgg} */}
        </div>
      </div>
    )
  } else {
    return (
      <div className="">
        <button
          onClick={onClick}
          className={`relative flex justify-center items-center w-16 h-8 text-gray-300
         ${style}`}
        >
          <div
            className={`w-16 h-8 border-t -mx-1 flex justify-center items-center ${color}`}
          >
            <div>{limits}</div>

          </div>
        </button>
      </div>
    )
  }
}

export default Depth
