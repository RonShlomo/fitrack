'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

async function safeGetJson(res) {
  try { return await res.json() }
  catch { const t = await res.text().catch(()=> ''); return { success:false, error: t || `HTTP ${res.status}` } }
}

export default function StatisticsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editVals, setEditVals] = useState({ calories: '', protein: '' })

  const load = async () => {
    try {
      setLoading(true)
      const r = await fetch('/api/statistics')
      if (!r.ok) {
        const txt = await r.text().catch(()=> '')
        setError(`HTTP ${r.status} ${txt}`); return
      }
      const j = await safeGetJson(r)
      if (j.success) setItems(Array.isArray(j.data) ? j.data : [])
      else setError(j.error || 'שגיאה בטעינה')
    } catch {
      setError('שגיאה בחיבור לשרת')
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  const beginEdit = (row) => {
    setEditingId(row._id)
    setEditVals({
      calories: String(row.calories ?? ''),
      protein: String(row.protein ?? '')
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditVals({ calories:'', protein:'' })
  }

  const saveEdit = async (id) => {
    const calories = Number(editVals.calories)
    const protein  = Number(editVals.protein)
    if (isNaN(calories) || isNaN(protein)) return alert('אנא הזן מספרים תקינים')

    const r = await fetch('/api/statistics', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, calories, protein })
    })
    const j = await safeGetJson(r)
    if (r.ok && j.success) {
      setItems(prev => prev.map(x => x._id === id ? j.data : x))
      cancelEdit()
    } else {
      alert(j.error || `HTTP ${r.status}`)
    }
  }

  const deleteRow = async (id) => {
    if (!confirm('למחוק את השורה הזו מהסטטיסטיקה?')) return
    const r = await fetch(`/api/statistics?id=${id}`, { method: 'DELETE' })
    const j = await safeGetJson(r)
    if (r.ok && j.success) setItems(prev => prev.filter(x => x._id !== id))
    else alert(j.error || `HTTP ${r.status}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 text-white">
      <header className="bg-black/40 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-blue-300 hover:text-blue-200">← דף הבית</Link>
          <h1 className="text-3xl font-black">סטטיסטיקה</h1>
          <div/>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8">
            <div className="flex justify-between items-center">
              <span className="break-words">{String(error)}</span>
              <button onClick={()=>{ setError(null); load() }} className="bg-blue-600 px-4 py-2 rounded-lg">נסה שוב</button>
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid bg-gray-700/30 px-4 md:px-8 py-3 grid-cols-12 gap-4 text-sm font-bold text-gray-300">
            <div className="col-span-4">תאריך</div>
            <div className="col-span-3 text-center">סך קלוריות</div>
            <div className="col-span-3 text-center">סך חלבון (גרם)</div>
            <div className="col-span-2 text-center">פעולות</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-300">טוען...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-300">אין נתונים עדיין</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {items.map(row => {
                const isEditing = editingId === row._id
                return (
                  <div key={row._id} className="px-4 md:px-8 py-4 grid grid-cols-12 md:gap-4 items-center">
                    {/* Mobile stacked */}
                    <div className="md:hidden col-span-12 mb-2">
                      <div className="text-white font-semibold">{row.dateKey}</div>
                      {!isEditing ? (
                        <div className="text-sm text-gray-300 mt-1">
                          {row.calories} קק״ל • {row.protein} חלבון
                        </div>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
                            value={editVals.calories}
                            onChange={(e)=>setEditVals(s=>({...s, calories:e.target.value}))}
                            placeholder="קלוריות"
                          />
                          <input
                            type="number"
                            className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
                            value={editVals.protein}
                            onChange={(e)=>setEditVals(s=>({...s, protein:e.target.value}))}
                            placeholder="חלבון"
                          />
                        </div>
                      )}
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden md:block md:col-span-4">{row.dateKey}</div>

                    {!isEditing ? (
                      <>
                        <div className="hidden md:block md:col-span-3 text-center text-blue-300 font-semibold">
                          {row.calories}
                        </div>
                        <div className="hidden md:block md:col-span-3 text-center text-blue-300 font-semibold">
                          {row.protein}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="hidden md:block md:col-span-3">
                          <input
                            type="number"
                            className="w-full text-center bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
                            value={editVals.calories}
                            onChange={(e)=>setEditVals(s=>({...s, calories:e.target.value}))}
                          />
                        </div>
                        <div className="hidden md:block md:col-span-3">
                          <input
                            type="number"
                            className="w-full text-center bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2"
                            value={editVals.protein}
                            onChange={(e)=>setEditVals(s=>({...s, protein:e.target.value}))}
                          />
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="col-span-12 md:col-span-2 mt-3 md:mt-0 flex justify-end gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={()=>beginEdit(row)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm md:text-base"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={()=>deleteRow(row._id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm md:text-base"
                          >
                            מחק
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={()=>saveEdit(row._id)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm md:text-base"
                          >
                            שמור
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm md:text-base"
                          >
                            ביטול
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
