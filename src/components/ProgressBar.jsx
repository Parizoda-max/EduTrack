export default function ProgressBar({ value, tone = 'primary' }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div className="progress" aria-hidden="true">
      <div className={`progress-fill ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}