import { initialState } from "@/app/App"
import { MBO, ReducerAction } from "@/app/types"

type UpdateMboAction = ReducerAction & { type: "UPDATE_MBO" }

const updateBuys = (state: typeof initialState, mbo: MBO) => ({
  ...state,
  buys: {
    ...state.buys,
    now: {
      ...state.buys.now,
      [mbo.price]: state.buys.now[mbo.price]
        ? state.buys.now[mbo.price] + mbo.size
        : mbo.size,
    },
  },
})

const updateSells = (state: typeof initialState, mbo: MBO) => ({
  ...state,
  sells: {
    ...state.sells,
    now: {
      ...state.sells.now,
      [mbo.price]: state.sells.now[mbo.price]
        ? state.sells.now[mbo.price] + mbo.size
        : mbo.size,
    },
  },
})


const updateMbo = (
  state: typeof initialState,
  action: UpdateMboAction
): typeof initialState => {
  const mbo = action.payload

  if (mbo.action === 84) {
    if (mbo.side === 66) {
      return updateBuys(state, mbo)
    } else if (mbo.side === 65) {
      return updateSells(state, mbo)
    }
  }

  return state
}

export default updateMbo
