import { useCallback, useState, type PointerEvent } from "react"

/** Generic drag handle: calls onMove with the pointer clientX while dragging. */
export function useResizeHandle(onMove: (clientX: number) => void) {
  const [isResizing, setIsResizing] = useState(false)

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault()
      setIsResizing(true)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const move = (ev: globalThis.PointerEvent) => onMove(ev.clientX)
      const up = () => {
        setIsResizing(false)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
    },
    [onMove],
  )

  return { isResizing, onPointerDown }
}
