'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

async function safeGetJson(res) {
  // Try to parse JSON; if it fails (e.g., HTML error page), return a structured error
  try {
    return await res.json()
  } catch {
    const text = await res.text().catch(() => '')
    return { success: false, error: text || `HTTP ${res.status}` }
  }
}

export default function NutritionPage() {
  const [values, setValues] = useState([])   // nutrition_values
  const [log, setLog] = useState([])         // today’s entries
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedId, setSelectedId] = useState('')
  const [grams, setGrams] = useState('')

  const collator = useMemo(
    () => new Intl.Collator(['he','en'], { sensitivity: 'base', numeric: true }),
    []
  )
  const sortedValues = useMemo(
    () => [...(values || [])].sort((a,b)=>collator.compare((a?.name??'').trim(), (b?.name??'').trim())),
    [values, collator]
  )

  const totals = useMemo(() => {
    return (log || []).reduce(
      (acc, x) => {
        acc.calories += Number(x?.calories) || 0
        acc.protein  += Number(x?.protein)  || 0
        return acc
      },
      { calories: 0, protein: 0 }
    )
  }, [log])

  const loadAll = async () => {
    try {
      setLoading(true)

      const [vRes, lRes] = await Promise.allSettled([
        fetch('/api/nutrition-values'),
        fetch('/api/nutrition'),
      ])

      // nutrition-values
      if (vRes.status === 'fulfilled') {
        if (vRes.value.ok) {
          const vJson = await safeGetJson(vRes.value)
          if (vJson?.success) setValues(Array.isArray(vJson.data) ? vJson.data : [])
          else setError(vJson?.error || 'שגיאה בטעינת רשימת פריטים')
        } else {
          setError(`שגיאה בטעינת רשימת פריטים: HTTP ${vRes.value.status}`)
        }
      } else {
        setError('שגיאה בטעינת רשימת פריטים (רשת)')
      }

      // nutrition log
      if (lRes.status === 'fulfilled') {
        if (lRes.value.ok) {
          const lJson = await safeGetJson(lRes.value)
          if (lJson?.success) setLog(Array.isArray(lJson.data) ? lJson.data : [])
          else setError(lJson?.error || 'שגיאה בטעינת יומן')
        } else {
          setError(`שגיאה בטעינת יומן: HTTP ${lRes.value.status}`)
        }
      } else {
        setError('שגיאה בטעינת יומן (רשת)')
      }
    } catch (e) {
      setError('שגיאה כללית בטעינה')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const addEntry = async () => {
    try {
      if (!selectedId) return alert('בחר פריט מהרשימה')
      const g = Number(grams)
      if (!g || g <= 0) return alert('הכנס משקל בגרמים (> 0)')

      const res = await fetch('/api/nutrition', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ itemId: selectedId, grams: g })
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        return alert(`שגיאה בהוספה: HTTP ${res.status} ${txt}`)
      }
      const j = await safeGetJson(res)
      if (j?.success) {
        setLog(prev => [j.data, ...(prev||[])])
        setGrams('')
      } else {
        alert(j?.error || 'שגיאה בהוספה')
      }
    } catch {
      alert('שגיאה בהוספה (רשת)')
    }
  }

  const deleteEntry = async (id) => {
    try {
      if (!confirm('למחוק רשומה זו?')) return
      const res = await fetch(`/api/nutrition?id=${id}`, { method:'DELETE' })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        return alert(`שגיאה במחיקה: HTTP ${res.status} ${txt}`)
      }
      const j = await safeGetJson(res)
      if (j?.success) setLog(prev => (prev||[]).filter(x => x?._id !== id))
      else alert(j?.error || 'שגיאה במחיקה')
    } catch {
      alert('שגיאה במחיקה (רשת)')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-black to-amber-900 text-white">
      {/* Header */}
      <header className="bg-black/40 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-amber-300 hover:text-amber-200">← דף הבית</Link>
          <h1 className="text-3xl font-black">מעקב תזונה</h1>
          <div />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8">
            <div className="flex justify-between items-center">
              <span className="break-words">{String(error)}</span>
              <button onClick={()=>{ setError(null); loadAll(); }} className="bg-amber-600 px-4 py-2 rounded-lg">נסה שוב</button>
            </div>
          </div>
        )}

        {/* Add form */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">בחר פריט (מתוך ערכים תזונתיים)</label>
              <select
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3"
                value={selectedId}
                onChange={e=>setSelectedId(e.target.value)}
              >
                <option value="">— בחר פריט —</option>
                {sortedValues.map(v => (
                  <option key={v?._id} value={v?._id}>
                    {v?.name} • {v?.calories} קק&quot;ל • {v?.protein} חלבון (ל־100 גרם)
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-300 text-sm font-semibold mb-2">משקל (גרם)</label>
              <input
                type="number"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3"
                placeholder="למשל 200"
                value={grams}
                onChange={e=>setGrams(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={addEntry}
            disabled={loading}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-500 px-4 py-3 rounded-xl font-bold"
          >
            {loading ? '...' : 'הוסף לרשימה'}
          </button>
        </div>

        {/* Responsive list */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
          <div className="hidden md:grid bg-gray-700/30 px-4 md:px-8 py-3 grid-cols-12 gap-4 text-sm font-bold text-gray-300">
            <div className="col-span-5">שם</div>
            <div className="col-span-2 text-center">גרמים</div>
            <div className="col-span-2 text-center">קלוריות</div>
            <div className="col-span-2 text-center">חלבון (גרם)</div>
            <div className="col-span-1 text-center">מחיקה</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-300">טוען...</div>
          ) : (log||[]).length === 0 ? (
            <div className="p-10 text-center text-gray-300">אין רשומות עדיין</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {(log||[]).map(entry => (
                <div key={entry?._id} className="px-4 md:px-8 py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4">
                  {/* Mobile */}
                  <div className="md:hidden mb-3">
                    <div className="text-lg font-semibold text-white">{entry?.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {entry?.grams} גרם • {entry?.calories} קק&quot;ל • {entry?.protein} חלבון
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block md:col-span-5">{entry?.name}</div>
                  <div className="hidden md:block md:col-span-2 text-center">{entry?.grams}</div>
                  <div className="hidden md:block md:col-span-2 text-center text-amber-300 font-semibold">{entry?.calories}</div>
                  <div className="hidden md:block md:col-span-2 text-center text-amber-300 font-semibold">{entry?.protein}</div>
                  <div className="mt-3 md:mt-0 md:col-span-1 flex justify-end">
                    <button onClick={()=>deleteEntry(entry?._id)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm md:text-base">
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
