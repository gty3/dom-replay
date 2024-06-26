

const AccountValue = ({
  accountValue,
  profit,
  side,
}: {
  accountValue: number
  profit: number
  side: string
}) => {
  const accountProfit = profit / 10000  + ( accountValue / 10000)
  const position = side === "B" ? "LONG" : side === "S" ? "SHORT" : ""
  const color =
    side === "B" ? "text-blue-500" : side === "B" ? "text-red-500" : ""
  const profitColor = profit >= 0 ? "text-green-500" : "text-red-500"

  return (
    <div className="flex flex-row">
      <div className="px-5 pt-3 w-36">
        <div className="text-xs">POSITION</div>
        <div>{position}</div>
      </div>

      <div className="px-3 pt-3 ml-8 w-32 text-xs">
        UNREALIZED PNL
        <div
          className={`text-xl`}
        >
          {accountProfit.toFixed(2)}
          <span className="pl-1 text-xs">USD</span>
        </div>
      </div>
    </div>
  )
}

export default AccountValue
