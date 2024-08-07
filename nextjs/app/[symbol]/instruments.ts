const instruments: { [key: string]: { increment: number; minPrice: number } } =
  {
    CL: {
      increment: 10000000,
      minPrice: 100000,
    },
    ZW: {
      increment: 250000000,
      minPrice: 125000,
    },
    NQ: {
      increment: 250000000,
      minPrice: 50000,
    },
    GC: {
      increment: 100000000,
      minPrice: 100000,
    },
    ZB: {
      increment: 31250000,
      minPrice: 312500,
    },
    ES: {
      increment: 250000000,
      minPrice: 125000,
    },
    ZN: {
      increment: 15625000,
      minPrice: 156250,
    },
    UB: {
      increment: 31250000,
      minPrice: 312500,
    },
  }

export default instruments
