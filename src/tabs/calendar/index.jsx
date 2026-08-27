import { useMemo, useState } from 'react'
import { useEvents } from './hooks/useEvents'
import { useEventCategories } from './hooks/useEventCategories'
import { toDateStr, categoriesById, filterEventsByCategory, UNCATEGORIZED } from './utils/calendar'
import CalendarGrid from './components/CalendarGrid/CalendarGrid'
import CategoryBar from './components/CategoryBar/CategoryBar'
import CategoryManagerModal from './components/CategoryManagerModal/CategoryManagerModal'
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
  const { data: categories = [], add: addCategory, update: updateCategory, remove: removeCategory } =
    useEventCategories()

  const [{ year, month }, setNav] = useState(currentYearMonth)

  // Empty set means no filter — show every category.
  const [selectedCategories, setSelectedCategories] = useState(() => new Set())
  const [managerOpen, setManagerOpen] = useState(false)

  const byId = useMemo(() => categoriesById(categories), [categories])

  const counts = useMemo(() => {
    const tally = {}
    for (const event of events) {
      const key = event.category_id ?? UNCATEGORIZED
      tally[key] = (tally[key] ?? 0) + 1
    }
    return tally
  }, [events])

  const visibleEvents = useMemo(
    () => filterEventsByCategory(events, selectedCategories),
    [events, selectedCategories]
  )

  function toggleCategory(id) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  function toggleComplete(event) {
    return update.mutateAsync({ id: event.id, completed: !event.completed })
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

      <CategoryBar
        categories={categories}
        selected={selectedCategories}
        counts={counts}
        onToggle={toggleCategory}
        onClear={() => setSelectedCategories(new Set())}
        onManage={() => setManagerOpen(true)}
      />

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
          </div>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            events={visibleEvents}
            categoriesById={byId}
            onDayClick={openAdd}
            onEventClick={openEdit}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        )}

        <UpcomingSidebar
          events={visibleEvents}
          categoriesById={byId}
          onEventClick={openEdit}
          onToggleComplete={toggleComplete}
        />
      </div>

      {formOpen && (
        <EventFormModal
          event={editEvent}
          prefillDate={prefillDate}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDeleteFromModal}
          onClose={closeForm}
        />
      )}

      {managerOpen && (
        <CategoryManagerModal
          categories={categories}
          onAdd={(c) => addCategory.mutateAsync(c)}
          onUpdate={(c) => updateCategory.mutateAsync(c)}
          onDelete={(id) => removeCategory.mutateAsync(id)}
          onClose={() => setManagerOpen(false)}
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
