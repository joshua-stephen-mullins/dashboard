import { useState } from 'react'
import { useEvents } from './hooks/useEvents'
import { toDateStr } from './utils/calendar'
import CalendarGrid from './components/CalendarGrid/CalendarGrid'
import UpcomingSidebar from './components/UpcomingSidebar/UpcomingSidebar'
import EventFormModal from './components/EventFormModal/EventFormModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import styles from './Calendar.module.css'

function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export default function CalendarTab() {
  const { data: events = [], isLoading, add, update, remove } = useEvents()

  const [{ year, month }, setNav] = useState(currentYearMonth)

  const [formOpen, setFormOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(undefined)
  const [prefillDate, setPrefillDate] = useState(undefined)
  const [deleteId, setDeleteId] = useState(null)

  function prevMonth() {
    setNav(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    )
  }

  function nextMonth() {
    setNav(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    )
  }

  function openAdd(dateStr) {
    setEditEvent(undefined)
    setPrefillDate(dateStr)
    setFormOpen(true)
  }

  function openEdit(event) {
    setEditEvent(event)
    setPrefillDate(undefined)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditEvent(undefined)
    setPrefillDate(undefined)
  }

  async function handleSave(payload) {
    if (payload.id) {
      await update.mutateAsync(payload)
    } else {
      await add.mutateAsync(payload)
    }
  }

  function handleDeleteFromModal() {
    if (!editEvent) return
    setDeleteId(editEvent.id)
    closeForm()
  }

  async function confirmDelete() {
    await remove.mutateAsync(deleteId)
    setDeleteId(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calendar</h1>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => openAdd(toDateStr(new Date()))}
        >
          + Add Event
        </button>
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
          </div>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            events={events}
            onDayClick={openAdd}
            onEventClick={openEdit}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        )}

        <UpcomingSidebar events={events} onEventClick={openEdit} />
      </div>

      {formOpen && (
        <EventFormModal
          event={editEvent}
          prefillDate={prefillDate}
          onSave={handleSave}
          onDelete={handleDeleteFromModal}
          onClose={closeForm}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete event"
          message="This event will be permanently deleted."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
