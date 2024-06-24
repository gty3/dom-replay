
const Price = ({ priceNumber }: { priceNumber: number }) => {
  const visualPrice = (priceNumber * 1e-9).toString()
  console.log(priceNumber)

  return (
    <h3 className="flex justify-center items-center w-12 text-sm">
      {visualPrice}
    </h3>
  )
}

export default Price
