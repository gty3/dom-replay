import { useEffect, useRef } from "react"
import { ReducerAction } from "../../types"

const useDomScroll = (increment: number, dispatch: React.Dispatch<ReducerAction>) => {
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        dispatch({ type: "SCROLL_UP", payload: increment })
      } else {
        dispatch({ type: "SCROLL_DOWN", payload: increment })
      }
    }
    window.addEventListener("wheel", handleWheel)

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartY.current === null) return;

      const touchEndY = event.touches[0].clientY;
      const deltaY = touchEndY - touchStartY.current;

      if (Math.abs(deltaY) >= 32) {
        if (deltaY < 0) {
          dispatch({ type: "SCROLL_DOWN", payload: increment });
        } else {
          dispatch({ type: "SCROLL_UP", payload: increment });
        }
        touchStartY.current = touchEndY;
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    // Cleanup function to remove the event listeners
    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    }
  }, [dispatch, increment])
}

export default useDomScroll