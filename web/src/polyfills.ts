/**
 * Browser polyfills for Node.js modules
 * Required for circomlibjs and snarkjs to work in browser
 */

import { Buffer } from 'buffer'

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
  ;(window as any).global = window
}

export {}
