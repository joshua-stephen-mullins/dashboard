import { getUpcomingEvents, getOpenAssignments, formatEventDate, eventColor } from '../../utils/calendar'
import styles from './UpcomingSidebar.module.css'

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

export default function UpcomingSidebar({ events, categoriesById, onEventClick, onToggleComplete }) {
  const upcoming = getUpcomingEvents(events, 5)
  const assignments = getOpenAssignments(events, categoriesById, 6)

  return (
    <aside className={styles.sidebar}>
      {assignments.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Assignments</h2>
          <ul className={styles.list}>
            {assignments.map((event) => (
              <li key={event.id} className={styles.assignmentRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={false}
                  onChange={() => onToggleComplete(event)}
                  aria-label={`Mark ${event.title} complete`}
                />
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => onEventClick(event)}
                >
                  <span className={styles.details}>
                    <span className={styles.title}>{event.title}</span>
                    <span className={[styles.date, event.overdue && styles.overdue].filter(Boolean).join(' ')}>
                      {event.overdue ? 'Overdue · ' : ''}
                      {formatEventDate(event.end_date || event.date, event.start_time)}
                    </span>
                    {event.course && <span className={styles.course}>{event.course}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.heading}>Upcoming</h2>

        {upcoming.length === 0 ? (
          <p className={styles.empty}>No upcoming events</p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => onEventClick(event)}
                >
                  <span className={[styles.bar, COLOR_CLASS[eventColor(event, categoriesById)]].filter(Boolean).join(' ')} />
                  <span className={styles.details}>
                    <span className={[styles.title, event.completed && styles.titleDone].filter(Boolean).join(' ')}>
                      {event.title}
                    </span>
                    <span className={styles.date}>{formatEventDate(event.date, event.start_time)}</span>
                    {event.course && <span className={styles.course}>{event.course}</span>}
                    {event.location && (
                      <span className={styles.location}>{event.location}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
