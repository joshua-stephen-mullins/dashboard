import Modal from '../Modal/Modal'
import styles from './ConfirmModal.module.css'

export default function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.body}>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${danger ? styles.danger : ''}`}
            onClick={() => { onConfirm(); onClose() }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
