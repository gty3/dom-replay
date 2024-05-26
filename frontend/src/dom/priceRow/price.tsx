const Price = ({ fixedStringPrice }: { fixedStringPrice: string }) => {
  return (
    <h3 className="flex justify-center items-center w-12 text-sm">
      {fixedStringPrice}
    </h3>
  )
}

export default Price
