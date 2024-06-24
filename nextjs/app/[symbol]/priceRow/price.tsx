
const Price = ({ priceNumber, increment }: { priceNumber: number, increment: number }) => {
  const decimals = increment * 1e-9;
  const decimalPlaces = decimals.toString().split('.')[1]?.length || 0;
  const visualPrice = (priceNumber * 1e-9).toFixed(decimalPlaces);

  return (
    <h3 className="flex justify-center items-center w-12 text-sm">
      {visualPrice}
    </h3>
  )
}

export default Price
