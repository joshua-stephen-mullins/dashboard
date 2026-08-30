import { useMemo, useState } from 'react'
import { fmtGravity, fmtPh, fmtTemp } from '../../utils/calc'
import styles from './FermentationChart.module.css'

// Hand-rolled SVG — the project has no charting dependency, and three
// series over a handful of points does not warrant one.
//
// Gravity, temperature and pH live on wildly different scales, so each
// series is normalised against its own min/max. The legend carries each
// series' real range so the shapes stay readable without lying about
// the numbers.
const SERIES = [
  { key: 'gravity',       label: 'Gravity', className: 'gravity',     format: fmtGravity },
  { key: 'temperature_f', label: 'Temp',    className: 'temperature', format: fmtTemp },
  { key: 'ph',            label: 'pH',      className: 'ph',          format: fmtPh },
]

const W = 640
const H = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 16 }

function buildSeries(readings, key) {
  const points = readings
    .map((r) => ({ t: new Date(r.recorded_at).getTime(), v: r[key] == null ? null : Number(r[key]) }))
    .filter((p) => p.v != null && !Number.isNaN(p.t))

  if (points.length === 0) return null

  const values = points.map((p) => p.v)
  return { points, min: Math.min(...values), max: Math.max(...values) }
}

export default function FermentationChart({ readings = [] }) {
  const [hidden, setHidden] = useState([])

  const series = useMemo(() => {
    const out = {}
    for (const s of SERIES) out[s.key] = buildSeries(readings, s.key)
    return out
  }, [readings])

  const times = readings
    .map((r) => new Date(r.recorded_at).getTime())
    .filter((t) => !Number.isNaN(t))

  if (times.length < 2) {
    return (
      <p className={styles.empty}>
        Log at least two readings to see the fermentation curve.
      </p>
    )
  }

  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const tSpan = tMax - tMin || 1

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (t) => PAD.left + ((t - tMin) / tSpan) * plotW
  const y = (v, min, max) => {
    const span = max - min || 1
    return PAD.top + plotH - ((v - min) / span) * plotH
  }

  function toggle(key) {
    setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Fermentation readings over time"
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            className={styles.gridline}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + plotH * f}
            y2={PAD.top + plotH * f}
          />
        ))}

        {SERIES.map((s) => {
          const data = series[s.key]
          if (!data || hidden.includes(s.key)) return null
          const d = data.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.v, data.min, data.max)}`)
            .join(' ')
          return (
            <g key={s.key}>
              <path className={`${styles.line} ${styles[s.className]}`} d={d} />
              {data.points.map((p) => (
                <circle
                  key={p.t}
                  className={`${styles.dot} ${styles[s.className]}`}
                  cx={x(p.t)}
                  cy={y(p.v, data.min, data.max)}
                  r="3"
                />
              ))}
            </g>
          )
        })}
      </svg>

      <div className={styles.axis}>
        <span>{new Date(tMin).toLocaleDateString()}</span>
        <span>{new Date(tMax).toLocaleDateString()}</span>
      </div>

      <ul className={styles.legend}>
        {SERIES.map((s) => {
          const data = series[s.key]
          const off = hidden.includes(s.key)
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`${styles.legendBtn} ${off ? styles.off : ''}`}
                onClick={() => toggle(s.key)}
                disabled={!data}
              >
                <span className={`${styles.swatch} ${styles[s.className]}`} />
                {s.label}
                <span className={styles.range}>
                  {data ? `${s.format(data.min)} – ${s.format(data.max)}` : 'no data'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
