import { useState } from 'react'
import Modal from '../../../../components/Modal/Modal'
import { supabase } from '../../../../lib/supabase'
import styles from './RecipeFormModal.module.css'

const EMPTY_INGREDIENT = { quantity: '', unit: '', name: '' }

function buildInitialState(recipe) {
  if (!recipe) {
    return {
      name: '',
      ingredients: [{ ...EMPTY_INGREDIENT }],
      instructions: '',
      tags: '',
      servings: '',
      cook_time: '',
      source_url: '',
      image_url: '',
      imageFile: null,
      importUrl: '',
    }
  }
  return {
    name: recipe.name ?? '',
    ingredients: recipe.ingredients?.length ? recipe.ingredients : [{ ...EMPTY_INGREDIENT }],
    instructions: recipe.instructions ?? '',
    tags: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : (recipe.tags ?? ''),
    servings: recipe.servings ?? '',
    cook_time: recipe.cook_time ?? '',
    source_url: recipe.source_url ?? '',
    image_url: recipe.image_url ?? '',
    imageFile: null,
    importUrl: '',
  }
}

export default function RecipeFormModal({ recipe, onSave, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(recipe))
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isEdit = Boolean(recipe?.id)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setIngredient(i, key, value) {
    setForm((f) => {
      const ingredients = [...f.ingredients]
      ingredients[i] = { ...ingredients[i], [key]: value }
      return { ...f, ingredients }
    })
  }

  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_INGREDIENT }] }))
  }

  function removeIngredient(i) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  }

  async function handleImport() {
    if (!form.importUrl.trim()) return
    setImporting(true)
    setImportError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('parse-recipe', {
        body: { url: form.importUrl.trim() },
      })
      if (fnError) {
        const body = await fnError.context?.json?.().catch(() => null)
        throw new Error(body?.error ?? fnError.message)
      }
      if (data?.error) throw new Error(data.error)
      setForm((f) => ({
        ...f,
        name: data.name ?? f.name,
        ingredients: data.ingredients?.length ? data.ingredients : f.ingredients,
        instructions: data.instructions ?? f.instructions,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ?? f.tags),
        servings: data.servings ?? f.servings,
        cook_time: data.cook_time ?? f.cook_time,
        source_url: data.source_url ?? f.importUrl.trim(),
        image_url: data.image_url ?? f.image_url,
      }))
    } catch (e) {
      setImportError(e.message ?? 'Failed to import recipe')
    } finally {
      setImporting(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      let imageUrl = form.image_url || null

      if (form.imageFile) {
        const { data: { user } } = await supabase.auth.getUser()
        const path = `${user.id}/${Date.now()}-${form.imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(path, form.imageFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(uploadData.path)
        imageUrl = publicUrl
      }

      const payload = {
        name: form.name.trim(),
        ingredients: form.ingredients.filter((i) => i.name.trim()),
        instructions: form.instructions.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        servings: form.servings ? parseInt(form.servings, 10) : null,
        cook_time: form.cook_time.trim() || null,
        source_url: form.source_url.trim() || null,
        image_url: imageUrl,
      }

      await onSave(isEdit ? { id: recipe.id, ...payload } : payload)
      onClose()
    } catch (e) {
      setError(e.message ?? 'Failed to save recipe')
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Recipe' : 'Add Recipe'} onClose={onClose} closeOnOverlay={false} closeOnEscape={false}>
      <form onSubmit={handleSave} className={styles.form}>
        {!isEdit && (
          <>
            <div className={styles.importRow}>
              <input
                className={styles.input}
                type="url"
                placeholder="Paste a URL to import a recipe…"
                value={form.importUrl}
                onChange={(e) => setField('importUrl', e.target.value)}
              />
              <button
                type="button"
                className={styles.importBtn}
                onClick={handleImport}
                disabled={importing || !form.importUrl.trim()}
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
            {importError && <p className={styles.error}>{importError}</p>}
            <div className={styles.divider} />
          </>
        )}

        <label className={styles.label}>
          Name *
          <input
            className={styles.input}
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            Cook time
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 30 min"
              value={form.cook_time}
              onChange={(e) => setField('cook_time', e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Servings
            <input
              className={styles.input}
              type="number"
              min="1"
              value={form.servings}
              onChange={(e) => setField('servings', e.target.value)}
            />
          </label>
        </div>

        <label className={styles.label}>
          Tags
          <input
            className={styles.input}
            type="text"
            placeholder="italian, pasta, quick"
            value={form.tags}
            onChange={(e) => setField('tags', e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Image upload
          <input
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={(e) => setField('imageFile', e.target.files[0] ?? null)}
          />
        </label>

        <label className={styles.label}>
          Image URL
          <input
            className={styles.input}
            type="url"
            placeholder="https://…"
            value={form.image_url}
            onChange={(e) => setField('image_url', e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Source URL
          <input
            className={styles.input}
            type="url"
            placeholder="https://…"
            value={form.source_url}
            onChange={(e) => setField('source_url', e.target.value)}
          />
        </label>

        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Ingredients *</span>
          <button type="button" className={styles.addBtn} onClick={addIngredient}>
            + Add
          </button>
        </div>

        <div className={styles.ingredientList}>
          {form.ingredients.map((ing, i) => (
            <div key={i} className={styles.ingredientRow}>
              <input
                className={styles.inputSm}
                type="text"
                placeholder="Qty"
                value={ing.quantity}
                onChange={(e) => setIngredient(i, 'quantity', e.target.value)}
              />
              <input
                className={styles.inputSm}
                type="text"
                placeholder="Unit"
                value={ing.unit}
                onChange={(e) => setIngredient(i, 'unit', e.target.value)}
              />
              <input
                className={`${styles.input} ${styles.inputFlex}`}
                type="text"
                placeholder="Ingredient"
                value={ing.name}
                onChange={(e) => setIngredient(i, 'name', e.target.value)}
              />
              {form.ingredients.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeIngredient(i)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <label className={styles.label}>
          Instructions *
          <textarea
            className={styles.textarea}
            value={form.instructions}
            onChange={(e) => setField('instructions', e.target.value)}
            rows={6}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Recipe'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
