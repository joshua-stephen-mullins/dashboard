import { DOW_LABELS, getMonthGrid, formatMonthYear, layoutWeekEvents, BAR_SLOT, BAR_GAP } from '../../utils/calendar'
import styles from './CalendarGrid.module.css'

const COLOR_CLASS = {
  blue: styles.colorBlue,
  green: styles.colorGreen,
  amber: styles.colorAmber,
  red: styles.colorRed,
  teal: styles.colorTeal,
  purple: styles.colorPurple,
  orange: styles.colorOrange,
  pink: styles.colorPink,
}

export default function CalendarGrid({ year, month, events, onDayClick, onEventClick, onPrev, onNext }) {
  const weeks = getMonthGrid(year, month)

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <button className={styles.navBtn} type="button" onClick={onPrev} aria-label="Previous month">‹</button>
        <span className={styles.monthLabel}>{formatMonthYear(year, month)}</span>
        <button className={styles.navBtn} type="button" onClick={onNext} aria-label="Next month">›</button>
      </div>

      <div className={styles.grid}>
        <div className={styles.dowRow}>
          {DOW_LABELS.map((label) => (
            <div key={label} className={styles.dowHeader}>{label}</div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const { positioned, trackCount } = layoutWeekEvents(events, week)
          const eventsAreaH = trackCount > 0 ? trackCount * BAR_SLOT + BAR_GAP + 4 : 0

          return (
            <div
              key={wi}
              className={[styles.weekRow, wi === weeks.length - 1 && styles.weekRowLast].filter(Boolean).join(' ')}
            >
              {/* Each day column spans the full row height — owns hover + click */}
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={[
                    styles.dayCol,
                    !cell.isCurrentMonth && styles.dayColOtherMonth,
                    cell.isToday && styles.dayColToday,
                  ].filter(Boolean).join(' ')}
                  onClick={() => onDayClick(cell.date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onDayClick(cell.date)}
                >
                  <span className={[styles.dayNum, cell.isToday && styles.dayNumToday].filter(Boolean).join(' ')}>
                    {Number(cell.date.slice(8))}
                  </span>
                </div>
              ))}

              {/* Absolutely-positioned overlay — pointer-events:none so clicks fall through to dayCol */}
              <div
                className={styles.eventsOverlay}
                style={{ '--events-h': `${eventsAreaH}px` }}
              >
                {positioned.map((ev) => (
                  <button
                    key={`${ev.id}-${wi}`}
                    type="button"
                    className={[styles.eventBar, COLOR_CLASS[ev.color]].filter(Boolean).join(' ')}
                    style={{
                      '--col-start': ev.colStart,
                      '--col-span': ev.colEnd - ev.colStart + 1,
                      '--track': ev.track,
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
