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
            <span className={styles.metaItem}>⏱ {recipe.cook_time}</span>
          )}
          {recipe.servings && (
            <span className={styles.metaItem}>👤 {recipe.servings}</span>
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
