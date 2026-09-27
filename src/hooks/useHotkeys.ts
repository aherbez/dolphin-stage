import { useEffect, useLayoutEffect, useRef } from 'react'

/** Handlers keyed by lowercased `KeyboardEvent.key`, e.g. `m`, `escape`, `delete`. */
export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  return target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'range'].includes(target.type)
}

/**
 * Registers single-key shortcuts while `enabled`. Keys are ignored while typing in a text
 * field and when combined with Ctrl/Cmd/Alt, so browser and OS shortcuts keep working.
 */
export function useHotkeys(keys: HotkeyMap, enabled = true) {
  // Read the latest handlers without re-subscribing on every render
  const keysRef = useRef(keys)
  useLayoutEffect(() => {
    keysRef.current = keys
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return
      const handler = keysRef.current[e.key.toLowerCase()]
      if (!handler) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
