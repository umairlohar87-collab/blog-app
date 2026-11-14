export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <div className="state-icon" aria-hidden="true">⚠️</div>
      <h2 className="state-title">{title}</h2>
      {message && <p className="state-message">{message}</p>}
      {onRetry && (
        <div className="state-action">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
