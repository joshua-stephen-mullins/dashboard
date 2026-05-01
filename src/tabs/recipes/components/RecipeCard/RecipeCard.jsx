import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe, onClick }) {
  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.imageWrap}>
        {recipe.image_url ? (
          <img className={styles.image} src={recipe.image_url} alt={recipe.name} />
        ) : (
          <div className={styles.placeholder}>🍽</div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{recipe.name}</h3>

        <div className={styles.meta}>
          {recipe.cook_time && (
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {recipe.cook_time}
            </span>
          )}
          {recipe.servings && (
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {recipe.servings}
            </span>
          )}
        </div>

        {recipe.tags?.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
            {recipe.tags.length > 3 && (
              <span className={styles.tag}>+{recipe.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
