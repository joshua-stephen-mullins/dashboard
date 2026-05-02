export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const EVENT_COLORS = ['blue', 'green', 'amber', 'red', 'teal', 'purple', 'orange', 'pink']

// Must stay in sync with the CSS values in CalendarGrid.module.css
export const BAR_HEIGHT = 20
export const BAR_GAP = 2
export const BAR_SLOT = BAR_HEIGHT + BAR_GAP

export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = todayStr()
  const startDow = firstDay.getDay()

  const cells = []

  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - (startDow - i))
    cells.push({ date: toDateStr(d), isCurrentMonth: false, isToday: false })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = toDateStr(new Date(year, month, d))
    cells.push({ date: dateStr, isCurrentMonth: true, isToday: dateStr === today })
  }

  const trailing = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year, month + 1, i)
    cells.push({ date: toDateStr(d), isCurrentMonth: false, isToday: false })
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getUpcomingEvents(events, count = 5) {
  const today = todayStr()
  return [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
      if (a.start_time) return -1
      if (b.start_time) return 1
      return 0
    })
    .slice(0, count)
}

function lastIndexWhere(arr, pred) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) return i
  }
  return -1
}

// Returns positioned events for a single week row, each annotated with
// colStart, colEnd (0-6), and track (stacking row index).
export function layoutWeekEvents(events, week) {
  const weekStart = week[0].date
  const weekEnd = week[6].date

  const overlapping = events
    .filter((e) => {
      const endDate = e.end_date || e.date
      return e.date <= weekEnd && endDate >= weekStart
    })
    .map((e) => {
      const endDate = e.end_date || e.date
      const colStart = week.findIndex((cell) => cell.date >= e.date)
      const colEnd = lastIndexWhere(week, (cell) => cell.date <= endDate)
      return {
        ...e,
        colStart: colStart === -1 ? 0 : colStart,
        colEnd: colEnd === -1 ? 6 : colEnd,
      }
    })
    .sort((a, b) =>
      a.colStart !== b.colStart
        ? a.colStart - b.colStart
        : (b.colEnd - b.colStart) - (a.colEnd - a.colStart)
    )

  // Greedy interval scheduling — assign each event to the first track that
  // doesn't already have an event ending on or after this event's start col.
  const trackEnds = []
  for (const ev of overlapping) {
    let track = trackEnds.findIndex((end) => end < ev.colStart)
    if (track === -1) {
      track = trackEnds.length
      trackEnds.push(ev.colEnd)
    } else {
      trackEnds[track] = ev.colEnd
    }
    ev.track = track
  }

  return { positioned: overlapping, trackCount: trackEnds.length }
}

export function formatEventDate(dateStr, startTime) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const datePart = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!startTime) return datePart
  const [h, m] = startTime.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${datePart} · ${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}
