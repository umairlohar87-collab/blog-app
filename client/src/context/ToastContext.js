import { createContext } from 'react'

/** Holds `{ show(message, type) }`. Provided by <ToastProvider> in components/Toast.jsx. */
export const ToastContext = createContext(null)
