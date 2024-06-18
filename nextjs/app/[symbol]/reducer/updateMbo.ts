import { State, MBO, ReducerAction } from "../../types"

type UpdateMboAction = ReducerAction & { type: "UPDATE_MBO" }

const updateBuys = (state: State, mbo: MBO) => ({
  ...state,
  marketBuys: {
    ...state.marketBuys,
      ...state.marketBuys,
      [mbo.price]: state.marketBuys[mbo.price]
        ? state.marketBuys[mbo.price] + mbo.size
        : mbo.size,
  },
})

const updateSells = (state: State, mbo: MBO) => ({
  ...state,
  marketSells: {
    ...state.marketSells,
      ...state.marketSells,
      [mbo.price]: state.marketSells[mbo.price]
        ? state.marketSells[mbo.price] + mbo.size
        : mbo.size,
  },
})

const updateMbo = (
  state: State,
  action: UpdateMboAction
): State => {
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
