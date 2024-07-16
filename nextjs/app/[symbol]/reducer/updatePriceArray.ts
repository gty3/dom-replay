import { BidOffer, State } from "@/app/types"

const updatePriceArray = (
  state: State,
  action: {
    type: "UPDATE_PRICE_ARRAY"
    payload: {
      priceArray: number[]
      time: number
      bids: BidOffer[]
      offers: BidOffer[]
    }
  }


): State => {
  return {
    ...state,
    marketBuys: {},
    marketSells: {},
    bids: Object.fromEntries(action.payload.bids.map((bid) => [bid.price.toString(), bid.size])),
    offers: Object.fromEntries(action.payload.offers.map((offer) => [offer.price.toString(), offer.size])),
    prices: action.payload.priceArray.map((price) => price.toString()),
    // datasetTime: new Date(mbp10.dataset_time?? "")
    highest: action.payload.offers[0].price.toString(),
    lowest: action.payload.bids[0].price.toString()
  }

  // return newState
}

export default updatePriceArray
