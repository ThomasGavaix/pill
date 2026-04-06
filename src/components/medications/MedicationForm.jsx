import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#6366f1', '#ec4899',
]

const UNITS = ['comprimé(s)', 'gélule(s)', 'ml', 'gouttes', 'sachet(s)', 'patch(s)', 'spray(s)', 'autre']

export default function MedicationForm({ medication, onClose }) {
  const { createMedication, updateMedication } = useApp()
  const [form, setForm] = useState({
    name: medication?.name || '',
    dosage: medication?.dosage || '',
    unit: medication?.unit || 'comprimé(s)',
    color: medication?.color || '#2563eb',
    notes: medication?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.dosage.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (medication) {
        await updateMedication(medication.id, form)
      } else {
        await createMedication(form)
      }
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">
          {medication ? 'Modifier le médicament' : 'Nouveau médicament'}
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label htmlFor="med-name">Nom du médicament</label>
            <input
              id="med-name"
              type="text"
              placeholder="ex: Doliprane, Metformine..."
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="med-dosage">Dosage</label>
              <input
                id="med-dosage"
                type="text"
                placeholder="ex: 1, 500mg..."
                value={form.dosage}
                onChange={(e) => set('dosage', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="med-unit">Unité</label>
              <select
                id="med-unit"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <div className="color-grid">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="med-notes">Notes (optionnel)</label>
            <textarea
              id="med-notes"
              placeholder="Instructions, précautions..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="stack stack-sm" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
              {saving ? 'Enregistrement...' : medication ? 'Enregistrer' : 'Ajouter'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
