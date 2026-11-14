import { useId } from 'react'

/** Label + input (or textarea/select via `as`) + hint + inline error. */
export default function FormField({ label, error, hint, as = 'input', id, className = '', children, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const describedBy = [error && `${fieldId}-error`, hint && `${fieldId}-hint`].filter(Boolean).join(' ') || undefined
  const Control = as

  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="field-label">
          {label}
        </label>
      )}
      <Control id={fieldId} className="input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props}>
        {children}
      </Control>
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
