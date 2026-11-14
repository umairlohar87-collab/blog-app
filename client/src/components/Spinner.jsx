export default function Spinner({ size = 'md', label = 'Loading…', center = false }) {
  const spinner = (
    <span className={`spinner spinner-${size}`} role="status">
      <span className="sr-only">{label}</span>
    </span>
  )
  return center ? <div className="spinner-center">{spinner}</div> : spinner
}
