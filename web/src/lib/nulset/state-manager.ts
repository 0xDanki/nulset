/**
 * Shared State Manager for NulSet
 * 
 * Manages ban list and Merkle root across Admin and Faucet pages.
 * Uses localStorage for persistence.
 */

export interface NulSetState {
  root: string
  bannedList: string[]
  timestamp: number
  depth: number
}

const STATE_KEY = 'nulset_state'

/**
 * Save ban list and root to localStorage
 */
export function saveState(state: NulSetState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
  console.log('[State Manager] Saved state:', state)
}

/**
 * Load ban list and root from localStorage
 */
export function loadState(): NulSetState | null {
  const stored = localStorage.getItem(STATE_KEY)
  if (!stored) {
    console.log('[State Manager] No saved state found')
    return null
  }
  
  try {
    const state = JSON.parse(stored) as NulSetState
    console.log('[State Manager] Loaded state:', state)
    return state
  } catch (err) {
    console.error('[State Manager] Failed to parse state:', err)
    return null
  }
}

/**
 * Clear saved state
 */
export function clearState(): void {
  localStorage.removeItem(STATE_KEY)
  console.log('[State Manager] Cleared state')
}

/**
 * Check if state exists
 */
export function hasState(): boolean {
  return localStorage.getItem(STATE_KEY) !== null
}

/**
 * Get current root (if any)
 */
export function getCurrentRoot(): string | null {
  const state = loadState()
  return state?.root || null
}

/**
 * Get current banned list (if any)
 */
export function getBannedList(): string[] {
  const state = loadState()
  return state?.bannedList || []
}
