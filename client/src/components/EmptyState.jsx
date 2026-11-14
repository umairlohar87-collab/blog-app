export default function EmptyState({ icon = '📝', title = 'Nothing here yet', message, action }) {
  return (
    <div className="state-box">
      <div className="state-icon" aria-hidden="true">{icon}</div>
      <h2 className="state-title">{title}</h2>
      {message && <p className="state-message">{message}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  )
}
