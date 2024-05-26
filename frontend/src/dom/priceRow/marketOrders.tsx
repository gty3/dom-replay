const MarketOrders = ({
  children,
  isBuy,
}: {
  children: React.ReactNode
  isBuy: boolean
}) => {
  const color = isBuy ? "text-red-500" : "text-blue-500"
  return (
    <div className={`right-0 bottom-0 w-2 text-xs ${color}`}>{children}</div>
  )
}

export default MarketOrders