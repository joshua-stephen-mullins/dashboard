import { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ title, onClose, closeOnOverlay = true, closeOnEscape = true, children }) {
  useEffect(() => {
    if (!closeOnEscape) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, closeOnEscape])

  return (
    <div className={styles.overlay} onClick={closeOnOverlay ? onClose : undefined}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
