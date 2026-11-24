export default function ConfidenceBar({ value, label, colorClass }) {
  const pct = Math.round(value * 100)
  const color = colorClass || (pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 truncate max-w-[70%]">{label}</span>
          <span className="font-semibold text-slate-800">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
