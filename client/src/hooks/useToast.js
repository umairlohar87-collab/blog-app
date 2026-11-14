import { useContext } from 'react'
import { ToastContext } from '../context/ToastContext'

/** Returns `{ show(message, type = 'info') }`. type: 'success' | 'error' | 'info'. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
