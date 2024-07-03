import { useEffect } from "react"
import { ReducerAction } from "../../types"

const useDomScroll = (increment: number, dispatch: React.Dispatch<ReducerAction>) => {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        dispatch({ type: "SCROLL_UP", payload: increment })
      } else {
        dispatch({ type: "SCROLL_DOWN", payload: increment })
      }
    }
    window.addEventListener("wheel", handleWheel)

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("wheel", handleWheel)
    }
  }, [dispatch, increment])
}

export default useDomScroll