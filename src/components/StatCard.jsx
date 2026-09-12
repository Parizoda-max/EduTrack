export default function StatCard({ label, value, tone, foot }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone ? tone : ''}`}>{value}</div>
      {foot ? <div className="stat-foot">{foot}</div> : null}
    </div>
  )
}