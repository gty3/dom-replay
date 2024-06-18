import { useEffect } from "react"
import { ReducerAction } from "../../../frontend/src/types"

const useDomScroll = (dispatch: React.Dispatch<ReducerAction>) => {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        dispatch({ type: "SCROLL_UP" })
      } else {
        dispatch({ type: "SCROLL_DOWN" })
      }
    }
    window.addEventListener("wheel", handleWheel)

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("wheel", handleWheel)
    }
  }, [dispatch])
}

export default useDomScroll