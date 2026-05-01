import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import styles from './CookingMode.module.css'

async function fetchRecipe(id) {
  const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

function parseSteps(instructions) {
  if (!instructions) return []
  const numbered = instructions.split(/\n+(?=\d+\.\s)/)
  if (numbered.length > 1) {
    return numbered.map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
  }
  return instructions.split('\n').map((s) => s.trim()).filter(Boolean)
}

function useWakeLock() {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    navigator.wakeLock.request('screen').then((lock) => {
      lockRef.current = lock
    }).catch(() => {})

    function reacquire() {
      if (document.visibilityState === 'visible' && !lockRef.current) {
        navigator.wakeLock.request('screen').then((lock) => {
          lockRef.current = lock
        }).catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', reacquire)
    return () => {
      document.removeEventListener('visibilitychange', reacquire)
      lockRef.current?.release()
    }
  }, [])
}

export default function CookingMode() {
  const { id } = useParams()
  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipe(id),
  })
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState(new Set())
  const [ingredientsOpen, setIngredientsOpen] = useState(true)
  useWakeLock()

  function toggleIngredient(i) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading…</div>
  }

  if (isError || !recipe) {
    return <div className={styles.loading}>Recipe not found.</div>
  }

  const steps = parseSteps(recipe.instructions)
  const hasSteps = steps.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <h1 className={styles.title}>{recipe.name}</h1>
          <div className={styles.meta}>
            {recipe.cook_time && <span className={styles.metaItem}>⏱ {recipe.cook_time}</span>}
            {recipe.servings && <span className={styles.metaItem}>👤 {recipe.servings} servings</span>}
          </div>
        </div>
        <button className={styles.closeBtn} onClick={() => window.close()}>✕ Exit</button>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.ingredients}${!ingredientsOpen ? ` ${styles.ingredientsCollapsed}` : ''}`}>
          <button className={styles.ingredientsToggle} onClick={() => setIngredientsOpen((o) => !o)}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            <span className={styles.toggleIcon}>{ingredientsOpen ? '▲' : '▼'}</span>
          </button>
          <ul className={styles.ingredientList}>
            {recipe.ingredients?.map((ing, i) => (
              <li
                key={i}
                className={`${styles.ingredient}${checked.has(i) ? ` ${styles.ingredientChecked}` : ''}`}
                onClick={() => toggleIngredient(i)}
              >
                <span className={`${styles.checkbox}${checked.has(i) ? ` ${styles.checkboxChecked}` : ''}`}>
                  {checked.has(i) ? '✓' : ''}
                </span>
                <span className={checked.has(i) ? styles.ingredientText : undefined}>
                  {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.instructions}>
          <h2 className={styles.sectionTitle}>
            {hasSteps ? `Step ${step + 1} of ${steps.length}` : 'Instructions'}
          </h2>

          <div className={styles.stepTextWrap}>
            <p className={styles.stepText}>
              {hasSteps ? steps[step] : recipe.instructions}
            </p>
          </div>

          {hasSteps && (
            <div className={styles.stepNav}>
              <button
                className={styles.navBtn}
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                ← Previous
              </button>
              <div className={styles.stepDots}>
                {steps.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot}${i === step ? ` ${styles.dotActive}` : ''}`}
                    onClick={() => setStep(i)}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className={styles.navBtn}
                onClick={() => setStep((s) => s + 1)}
                disabled={step === steps.length - 1}
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
