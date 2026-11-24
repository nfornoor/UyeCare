const CLASSES = {
  low:      'badge-low',
  moderate: 'badge-moderate',
  high:     'badge-high',
}

const LABELS = {
  low:      'Low Risk',
  moderate: 'Moderate Risk',
  high:     'High Risk',
}

export default function RiskBadge({ level }) {
  return <span className={CLASSES[level] || 'badge-low'}>{LABELS[level] || level}</span>
}
