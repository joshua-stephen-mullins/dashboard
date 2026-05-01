import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import styles from './RecipeDetailModal.module.css'

export default function RecipeDetailModal({ recipe, onEdit, onDelete, onClose }) {
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await onDelete(recipe.id)
    onClose()
  }

  return (
    <Modal title={recipe.name} onClose={onClose}>
      <div className={styles.content}>
        {recipe.image_url && (
          <img className={styles.image} src={recipe.image_url} alt={recipe.name} />
        )}

        <div className={styles.meta}>
          {recipe.cook_time && (
            <span className={styles.metaItem}>⏱ {recipe.cook_time}</span>
          )}
          {recipe.servings && (
            <span className={styles.metaItem}>👤 {recipe.servings} servings</span>
          )}
          <div className={styles.metaLinks}>
            {recipe.source_url && (
              <a
                className={styles.sourceLink}
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View source ↗
              </a>
            )}
            <button
              className={styles.cookBtn}
              type="button"
              onClick={() => window.open(`/cook/${recipe.id}`, '_blank', 'noopener')}
            >
              Cook mode
            </button>
          </div>
        </div>

        {recipe.tags?.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {recipe.ingredients?.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ingredients</h3>
            <ul className={styles.ingredientList}>
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className={styles.ingredient}>
                  {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.instructions && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Instructions</h3>
            <p className={styles.instructions}>{recipe.instructions}</p>
          </section>
        )}

        {confirming ? (
          <div className={styles.confirmRow}>
            <span className={styles.confirmText}>Delete "{recipe.name}"?</span>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} type="button" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} type="button" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <button className={styles.deleteBtn} type="button" onClick={() => setConfirming(true)}>
              Delete
            </button>
            <button className={styles.editBtn} type="button" onClick={() => onEdit(recipe)}>
              Edit
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
