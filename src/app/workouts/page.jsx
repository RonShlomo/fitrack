'use client'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

export default function WorkoutsPage() {
  // ---- Sorting helpers (Hebrew + English, case-insensitive, numeric-aware) ----
  const collator = useMemo(
    () => new Intl.Collator(['he', 'en'], { sensitivity: 'base', numeric: true }),
    []
  )
  const sortByDescription = (arr) =>
    [...arr].sort((a, b) =>
      collator.compare(
        (a.description ?? '').trim(),
        (b.description ?? '').trim()
      )
    )

  // ---- State (wrapped setter keeps array sorted always) ----
  const [exercisesRaw, _setExercises] = useState([])
  const setExercises = (next) =>
    _setExercises((prev) => sortByDescription(typeof next === 'function' ? next(prev) : next))

  const [newExercise, setNewExercise] = useState({ description: '', weight: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sorted view (belt & suspenders)
  const sortedExercises = useMemo(() => sortByDescription(exercisesRaw), [exercisesRaw])

  // ---- Load from server ----
  const loadExercises = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exercises')
      const result = await response.json()

      if (result.success) {
        // Even if server returns random order, we store sorted
        setExercises(result.data)
      } else {
        setError('שגיאה בטעינת התרגילים')
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת')
      console.error('Error loading exercises:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Add ----
  const addExercise = async () => {
    if (!newExercise.description.trim() || !newExercise.weight.trim()) {
      alert('אנא מלא את כל השדות')
      return
    }

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExercise.description,
          weight: parseFloat(newExercise.weight)
        })
      })
      const result = await response.json()

      if (result.success) {
        setExercises((prev) => [...prev, result.data]) // auto-sorted
        setNewExercise({ description: '', weight: '' })
      } else {
        alert('שגיאה בהוספת התרגיל: ' + result.error)
      }
    } catch (err) {
      alert('שגיאה בחיבור לשרת')
      console.error('Error adding exercise:', err)
    }
  }

  // ---- Delete ----
  const deleteExercise = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התרגיל?')) return

    try {
      const response = await fetch(`/api/exercises?id=${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        setExercises((prev) => prev.filter((ex) => ex.id !== id)) // auto-sorted
      } else {
        alert('שגיאה במחיקת התרגיל: ' + result.error)
      }
    } catch (err) {
      alert('שגיאה בחיבור לשרת')
      console.error('Error deleting exercise:', err)
    }
  }

  // ---- Save edit ----
  const saveEdit = async (id, description, weight) => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          description,
          weight: parseFloat(weight)
        })
      })
      const result = await response.json()

      if (result.success) {
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === id ? { ...ex, description, weight: parseFloat(weight) } : ex
          )
        ) // auto-sorted
        setEditingId(null)
      } else {
        alert('שגיאה בעדכון התרגיל: ' + result.error)
      }
    } catch (err) {
      alert('שגיאה בחיבור לשרת')
      console.error('Error updating exercise:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(220,38,38,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(220,38,38,0.05)_50%,transparent_75%)]"></div>

      {/* Header */}
      <header className="relative bg-black/40 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-red-400 hover:text-red-300 flex items-center gap-2 font-semibold transition-colors duration-200 group"
            >
              <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזרה לדף הבית
            </Link>

            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">מעקב אימונים</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl">💪</span>
                <div className="w-16 h-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-full"></div>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-2 00 px-6 py-4 rounded-xl mb-8 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">{error}</span>
              <button
                onClick={() => { setError(null); loadExercises() }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* Add New Exercise Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-300 text-sm font-semibold mb-3">תיאור התרגיל</label>
              <input
                type="text"
                value={newExercise.description}
                onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                placeholder="לדוגמה: בנץ' פרס עליון"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-3">משקל (ק״ג)</label>
              <input
                type="number"
                value={newExercise.weight}
                onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                placeholder="80"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={addExercise}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? '...' : 'הוסף תרגיל חדש'}
            </button>
          </div>
        </div>

        {/* Exercises List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 px-8 py-6 border-b border-gray-600/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              {sortedExercises.length > 0 && (
                <p className="text-gray-400 text-sm mt-1">סה״כ {sortedExercises.length} תרגילים</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-6">⏳</div>
              <p className="text-gray-400 text-lg font-medium">טוען תרגילים...</p>
            </div>
          ) : sortedExercises.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-8xl mb-6">🏋️</div>
              <h3 className="text-xl font-bold text-white mb-3">עדיין לא הוספת תרגילים</h3>
              <p className="text-gray-400 text-lg">התחל בהוספת התרגיל הראשון שלך למעלה</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">

              {sortedExercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isEditing={editingId === exercise.id}
                  onEdit={() => setEditingId(exercise.id)}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                  onDelete={deleteExercise}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ---- Row component ----
function ExerciseRow({ exercise, isEditing, onEdit, onSave, onCancel, onDelete }) {
  const [editValues, setEditValues] = useState({
    description: exercise.description,
    weight: exercise.weight.toString()
  })

  const handleSave = () => {
    if (editValues.description.trim()) {
      onSave(exercise.id, editValues.description, editValues.weight)
    }
  }

  const handleCancel = () => {
    setEditValues({
      description: exercise.description,
      weight: exercise.weight.toString()
    })
    onCancel()
  }

  return (
    <div className="px-4 md:px-8 py-6 hover:bg-gray-700/30 transition-colors duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editValues.description}
            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
            placeholder="תיאור התרגיל"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={editValues.weight}
              onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
              className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-center focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              placeholder="משקל"
            />
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105"
            >
              ✓ שמור
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105"
            >
              ✕ ביטול
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile */}
          <div className="md:hidden space-y-3">
            <div>
              <span className="text-white font-medium text-lg">{exercise.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">משקל:</span>
                <span className="font-bold text-red-400 text-xl">{exercise.weight} ק״ג</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  ערוך
                </button>
                <button
                  onClick={() => onDelete(exercise.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  מחק
                </button>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
            <div className="col-span-7">
              <span className="text-white font-medium">{exercise.description}</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-bold text-red-400 text-lg">{exercise.weight}</span>
            </div>
            <div className="col-span-3 flex gap-3 justify-center">
              <button
                onClick={onEdit}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 transform hover:scale-105"
              >
                ערוך
              </button>
              <button
                onClick={() => onDelete(exercise.id)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 transform hover:scale-105"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}