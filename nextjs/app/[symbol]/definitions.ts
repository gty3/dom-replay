
interface Definition {
  min_price_increment: number;

}


const definitions: Record<string, Definition> = {
"cl": {
    min_price_increment: 10000000,
  },
  "CL": {
    min_price_increment: 10000000,
  },
}

export default definitions
