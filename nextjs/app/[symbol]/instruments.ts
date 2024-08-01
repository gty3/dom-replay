const instruments: { [key: string]: { increment: number; minPrice: number } } =
  {
    CL: {
      increment: 10000000,
      minPrice: 100000,
    },
    ZW: {
      increment: 250000000,
      minPrice: 1250000,
    },
    NQ: {
      increment: 250000000,
      minPrice: 500000,
    },
    GC: {
      increment: 100000000,
      minPrice: 1000000,
    },
    ZB: {
      increment: 31250000,
      minPrice: 3125000,
    },
    ES: {
      increment: 250000000,
      minPrice: 1250000,
    },
  }

export default instruments
