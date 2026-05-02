import { getUpcomingEvents, formatEventDate } from '../../utils/calendar'
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

export default function UpcomingSidebar({ events, onEventClick }) {
  const upcoming = getUpcomingEvents(events, 5)

  return (
    <aside className={styles.sidebar}>
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
                <span className={[styles.bar, COLOR_CLASS[event.color]].filter(Boolean).join(' ')} />
                <span className={styles.details}>
                  <span className={styles.title}>{event.title}</span>
                  <span className={styles.date}>{formatEventDate(event.date, event.start_time)}</span>
                  {event.location && (
                    <span className={styles.location}>{event.location}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
