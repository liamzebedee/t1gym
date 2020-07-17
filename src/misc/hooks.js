import { useState, useCallback, useEffect } from "react"

export function useHoverPickSelector() {
    const [selected, setSelected] = useState(null)
    const [hovered, setHovered] = useState(null)

    function _onHover(i) {
        setHovered(i)
    }
    const onHover = useCallback(_onHover)

    function _onSelect(i) {
        setSelected(i)
    }
    const onSelect = useCallback(_onSelect)

    const [previewed, setPreviewed] = useState(null)
    useEffect(() => {
        if (hovered !== null) setPreviewed(hovered)
        else if (selected !== null) setPreviewed(selected)
        else setPreviewed(null)
    }, [selected, hovered])

    return [previewed, selected, hovered, onHover, onSelect]
}