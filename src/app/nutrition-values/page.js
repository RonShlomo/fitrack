'use client'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

export default function NutritionValuesPage() {
  // ---- Sorting (render-time only) ----
  const collator = useMemo(
    () => new Intl.Collator(['he', 'en'], { sensitivity: 'base', numeric: true }),
    []
  )
  const sortByName = useCallback(
    (arr) =>
      [...arr].sort((a, b) =>
        collator.compare((a.name ?? '').trim(), (b.name ?? '').trim())
      ),
    [collator]
  )

  // ---- State ----
  const [itemsRaw, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', calories: '', protein: '' })

  // Render-sorted list (single source of truth)
  const items = useMemo(() => sortByName(itemsRaw), [itemsRaw, sortByName])

  // ---- Data load (guard StrictMode double-run in dev) ----
  const didLoad = useRef(false)
  const loadItems = useCallback(async () => {
    try {
      if (!didLoad.current) setLoading(true) // avoid spinner flash on dev double-run
      const r = await fetch('/api/nutrition-values')
      const j = await r.json()
      if (j.success) setItems(j.data)
      else setError(j.error || 'שגיאה בטעינה')
    } catch {
      setError('שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true
    loadItems()
  }, [loadItems])

  // ---- Helpers ----
  const nameExists = useCallback(
    (name, exceptId = null) => {
      const t = (name ?? '').trim().toLowerCase()
      return items.some(
        (x) => x._id !== exceptId && (x.name ?? '').trim().toLowerCase() === t
      )
    },
    [items]
  )

  // ---- CRUD ----
  const addItem = async () => {
    const name = newItem.name.trim()
    const calories = Number(newItem.calories)
    const protein = Number(newItem.protein)
    if (!name || isNaN(calories) || isNaN(protein)) {
      alert('אנא מלא שם, קלוריות וחלבון (מספרים)')
      return
    }
    if (nameExists(name)) {
      alert('פריט עם שם זה כבר קיים')
      return
    }

    const r = await fetch('/api/nutrition-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, calories, protein }),
    })
    const j = await r.json()
    if (j.success) {
      setItems((p) => [...p, j.data])
      setNewItem({ name: '', calories: '', protein: '' })
    } else {
      alert(j.error || 'שגיאה בהוספה')
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('למחוק את הפריט?')) return
    const r = await fetch(`/api/nutrition-values?id=${id}`, { method: 'DELETE' })
    const j = await r.json()
    if (j.success) {
      setItems((p) => p.filter((x) => x._id !== id))
    } else {
      alert(j.error || 'שגיאה במחיקה')
    }
  }

  const saveEdit = async (id, name, calories, protein) => {
    const n = name.trim(),
      cal = Number(calories),
      pro = Number(protein)
    if (!n || isNaN(cal) || isNaN(pro)) {
      alert('אנא מלא שם, קלוריות וחלבון (מספרים)')
      return
    }
    if (nameExists(n, id)) {
      alert('פריט עם שם זה כבר קיים')
      return
    }

    const r = await fetch('/api/nutrition-values', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: n, calories: cal, protein: pro }),
    })
    const j = await r.json()
    if (j.success) {
      setItems((p) => p.map((x) => (x._id === id ? j.data : x)))
      setEditingId(null)
    } else {
      alert(j.error || 'שגיאה בעדכון')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 text-white">
      <header className="bg-black/40 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-green-300 hover:text-green-200">
            ← דף הבית
          </Link>
          <h1 className="text-3xl font-black">ערכים תזונתיים</h1>
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null)
                  loadItems()
                }}
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* Add form */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              className="md:col-span-2 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3"
              placeholder="שם (למשל: חזה עוף מבושל)"
              value={newItem.name}
              onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
            />
            <input
              type="number"
              className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3"
              placeholder="קלוריות"
              value={newItem.calories}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, calories: e.target.value }))
              }
            />
            <input
              type="number"
              className="bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3"
              placeholder="חלבון (גרם)"
              value={newItem.protein}
              onChange={(e) =>
                setNewItem((s) => ({ ...s, protein: e.target.value }))
              }
            />
          </div>
          <button
            onClick={addItem}
            disabled={loading}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 px-4 py-3 rounded-xl font-bold"
          >
            {loading ? '...' : 'הוסף פריט'}
          </button>
        </div>

        {/* List */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="bg-gray-700/30 px-4 md:px-8 py-3 grid grid-cols-12 gap-4 text-sm font-bold text-gray-300">
            <div className="col-span-6">שם</div>
            <div className="col-span-3 text-center">קלוריות</div>
            <div className="col-span-3 text-center">חלבון (גרם)</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-300">טוען...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-300">אין פריטים עדיין</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {items.map((it) => (
                <Row
                  key={it._id}
                  item={it}
                  isEditing={editingId === it._id}
                  onEdit={() => setEditingId(it._id)}
                  onCancel={() => setEditingId(null)}
                  onSave={saveEdit}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Row({ item, isEditing, onEdit, onCancel, onSave, onDelete }) {
  const [vals, setVals] = useState({
    name: item.name,
    calories: item.calories?.toString() ?? '',
    protein: item.protein?.toString() ?? '',
  })

  return (
    <div className="px-4 md:px-8 py-5">
      {isEditing ? (
        <div className="grid grid-cols-12 gap-4 items-center">
          <input
            className="col-span-6 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
            value={vals.name}
            onChange={(e) => setVals((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            type="number"
            className="col-span-3 text-center bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
            value={vals.calories}
            onChange={(e) => setVals((s) => ({ ...s, calories: e.target.value }))}
          />
          <input
            type="number"
            className="col-span-3 text-center bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
            value={vals.protein}
            onChange={(e) => setVals((s) => ({ ...s, protein: e.target.value }))}
          />
          <div className="col-span-12 mt-3 flex gap-2 justify-end">
            <button
              onClick={() => onSave(item._id, vals.name, vals.calories, vals.protein)}
              className="bg-green-600 px-4 py-2 rounded-lg"
            >
              שמור
            </button>
            <button onClick={onCancel} className="bg-gray-600 px-4 py-2 rounded-lg">
              ביטול
            </button>
            <button
              onClick={() => onDelete(item._id)}
              className="bg-red-600 px-4 py-2 rounded-lg"
            >
              מחק
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-6">{item.name}</div>
          <div className="col-span-3 text-center text-green-300 font-semibold">
            {item.calories}
          </div>
          <div className="col-span-3 text-center text-green-300 font-semibold">
            {item.protein}
          </div>
          <div className="col-span-12 mt-3 flex gap-2 justify-end">
            <button onClick={onEdit} className="bg-blue-600 px-4 py-2 rounded-lg">
              ערוך
            </button>
            <button
              onClick={() => onDelete(item._id)}
              className="bg-red-600 px-4 py-2 rounded-lg"
            >
              מחק
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
