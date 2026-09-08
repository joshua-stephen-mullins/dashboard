import { useMemo } from 'react'
import { fmtGravity, fmtPh, fmtTemp } from '../../utils/calc'
import styles from './FermentationChart.module.css'

// Small multiples: one panel per measure, stacked on a shared time axis.
//
// These three series share no scale — gravity moves in thousandths, temperature
// in degrees, pH in tenths — so drawing them on one plot means three invented
// y-scales overlaid, which manufactures crossings that mean nothing.
//
// Each panel also gets a domain chosen for MEANING rather than fitted to its own
// min/max. Fitting is what made a pH that moved 0.25 render as a full-height
// climb: a series that barely moved should look like a series that barely moved.
const W = 480
const PANEL_H = 64
const PAD = { top: 8, right: 6, bottom: 8, left: 6 }
const PLOT_H = PANEL_H - PAD.top - PAD.bottom
const PLOT_W = W - PAD.left - PAD.right

// Gravity is read against its journey from OG down to dry, not against
// whatever window this batch happens to have covered so far.
function gravityDomain(values, og) {
  return [
    Math.min(0.995, ...values),
    Math.max(...(og == null ? values : [og, ...values])),
  ]
}

// The band that actually matters for a mead must: 3.0 is where fermentation
// starts to stall, and the top of the range is a healthy young must.
function phDomain(values) {
  return [Math.min(2.8, ...values), Math.max(4.2, ...values)]
}

// Centred on the data, but never narrower than 20°F — a few degrees of drift
// should read as a few degrees of drift.
function tempDomain(values) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const mid = (lo + hi) / 2
  const span = Math.max(hi - lo, 20)
  return [mid - span / 2, mid + span / 2]
}

const SERIES = [
  { key: 'gravity',       label: 'Gravity', className: 'gravity',     format: fmtGravity, domain: gravityDomain },
  { key: 'temperature_f', label: 'Temp',    className: 'temperature', format: fmtTemp,    domain: tempDomain },
  { key: 'ph',            label: 'pH',      className: 'ph',          format: fmtPh,      domain: phDomain },
]

const fmtDay = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const fmtStamp = (t) => new Date(t).toLocaleString(undefined, {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

export default function FermentationChart({ readings = [], og = null }) {
  const times = useMemo(
    () => readings.map((r) => new Date(r.recorded_at).getTime()).filter((t) => !Number.isNaN(t)),
    [readings],
  )

  const panels = useMemo(() => {
    return SERIES.map((s) => {
      const points = readings
        .map((r) => ({
          t: new Date(r.recorded_at).getTime(),
          v: r[s.key] == null ? null : Number(r[s.key]),
        }))
        .filter((p) => p.v != null && !Number.isNaN(p.t))

      if (points.length === 0) return null

      const values = points.map((p) => p.v)
      const [lo, hi] = s.key === 'gravity' ? s.domain(values, og) : s.domain(values)
      return { ...s, points, lo, hi, latest: points[points.length - 1].v }
    }).filter(Boolean)
  }, [readings, og])

  if (times.length < 2 || panels.length === 0) {
    return <p className={styles.empty}>Log at least two readings to see the fermentation curve.</p>
  }

  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const tSpan = tMax - tMin || 1

  const x = (t) => PAD.left + ((t - tMin) / tSpan) * PLOT_W
  const y = (v, lo, hi) => PAD.top + PLOT_H - ((v - lo) / (hi - lo || 1)) * PLOT_H

  return (
    <div className={styles.wrap}>
      {panels.map((p) => (
        <figure key={p.key} className={styles.panel}>
          <figcaption className={styles.panelHead}>
            <span className={styles.panelLabel}>{p.label}</span>
            <span className={`${styles.panelValue} ${styles[p.className]}`}>
              {p.format(p.latest)}
            </span>
          </figcaption>

          <div className={styles.panelBody}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${W} ${PANEL_H}`}
              role="img"
              aria-label={`${p.label} over time, ${p.format(p.lo)} to ${p.format(p.hi)}`}
            >
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  className={styles.gridline}
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={PAD.top + PLOT_H * f}
                  y2={PAD.top + PLOT_H * f}
                />
              ))}

              {p.points.length > 1 && (
                <path
                  className={`${styles.line} ${styles[p.className]}`}
                  d={p.points
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${x(pt.t)} ${y(pt.v, p.lo, p.hi)}`)
                    .join(' ')}
                />
              )}

              {p.points.map((pt) => (
                <circle
                  key={pt.t}
                  className={`${styles.dot} ${styles[p.className]}`}
                  cx={x(pt.t)}
                  cy={y(pt.v, p.lo, p.hi)}
                  r="4"
                >
                  <title>{`${fmtStamp(pt.t)} — ${p.format(pt.v)}`}</title>
                </circle>
              ))}
            </svg>

            <div className={styles.yAxis}>
              <span>{p.format(p.hi)}</span>
              <span>{p.format(p.lo)}</span>
            </div>
          </div>
        </figure>
      ))}

      <div className={styles.xAxis}>
        <span>{fmtDay(tMin)}</span>
        <span>{fmtDay(tMax)}</span>
      </div>
    </div>
  )
}
