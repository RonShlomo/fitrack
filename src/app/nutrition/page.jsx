'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function NutritionPage() {
  const [foods, setFoods] = useState([])
  const [newFood, setNewFood] = useState({ description: '', calories: '' })
  const [editingId, setEditingId] = useState(null)

  // Date helpers
  const todayKey = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const displayDate = useMemo(() => {
    return new Date().toLocaleDateString('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }, [])

  const STORAGE_KEY = 'fitrack_nutrition_days'

  // Load foods for today, clear if day changed automatically
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      const listForToday = Array.isArray(parsed[todayKey]) ? parsed[todayKey] : []
      setFoods(listForToday)
    } catch (e) {
      console.error('Failed to load nutrition from localStorage', e)
    }
  }, [todayKey])

  // Persist on change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      parsed[todayKey] = foods
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } catch (e) {
      console.error('Failed to save nutrition to localStorage', e)
    }
  }, [foods, todayKey])

  const addFood = () => {
    if (!newFood.description.trim() || !newFood.calories.toString().trim()) {
      alert('אנא מלא את כל השדות')
      return
    }
    const caloriesNum = Number(newFood.calories)
    if (Number.isNaN(caloriesNum) || caloriesNum < 0) {
      alert('קלוריות חייב להיות מספר חיובי')
      return
    }
    const item = {
      id: crypto.randomUUID(),
      description: newFood.description.trim(),
      calories: caloriesNum
    }
    setFoods([...foods, item])
    setNewFood({ description: '', calories: '' })
  }

  const deleteFood = (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return
    setFoods(foods.filter(f => f.id !== id))
  }

  const saveEdit = (id, description, calories) => {
    const caloriesNum = Number(calories)
    if (!description.trim() || Number.isNaN(caloriesNum) || caloriesNum < 0) return
    setFoods(foods.map(f => f.id === id ? { ...f, description: description.trim(), calories: caloriesNum } : f))
    setEditingId(null)
  }

  const totalCalories = useMemo(() => foods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0), [foods])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(245,158,11,0.06)_50%,transparent_75%)]"></div>

      {/* Header */}
      <header className="relative bg-black/40 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-semibold transition-colors duration-200 group"
            >
              <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזרה לדף הבית
            </Link>

            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">
                מעקב תזונה
              </h1>
              <div className="flex items-center justify-center gap-3 mt-1">
                <span className="text-2xl">🥗</span>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-600 to-red-600 rounded-full"></div>
              </div>
              <div className="mt-2 text-gray-300 text-sm">{displayDate}</div>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Add New Food Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-300 text-sm font-semibold mb-3">
                תיאור המזון
              </label>
              <input
                type="text"
                value={newFood.description}
                onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                placeholder="לדוגמה: סלט קינואה"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-3">
                קלוריות
              </label>
              <input
                type="number"
                value={newFood.calories}
                onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                placeholder="300"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={addFood}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-[1.02]"
            >
              הוסף פריט מזון
            </button>
          </div>
        </div>

        {/* Foods List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 px-8 py-6 border-b border-gray-600/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {foods.length > 0 && (
                  <p className="text-gray-400 text-sm mt-1">סה״כ {foods.length} פריטים</p>
                )}
              </div>
              <div className="text-sm text-gray-300">
                סה"כ קלוריות היום: <span className="font-bold text-amber-400">{totalCalories}</span>
              </div>
            </div>
          </div>

          {foods.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-8xl mb-6">🥗</div>
              <h3 className="text-xl font-bold text-white mb-3">עדיין לא הוספת פריטי מזון</h3>
              <p className="text-gray-400 text-lg">התחל בהוספת הפריט הראשון שלך למעלה</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {/* Table Header */}
              <div className="bg-gray-700/30 px-4 md:px-8 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-sm font-bold text-gray-300">
                <div className="md:col-span-7">תיאור</div>
                <div className="md:col-span-2 text-center">קלוריות</div>
                <div className="md:col-span-3 text-center">פעולות</div>
              </div>
              {foods.map(food => (
                <FoodRow
                  key={food.id}
                  food={food}
                  isEditing={editingId === food.id}
                  onEdit={() => setEditingId(food.id)}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                  onDelete={deleteFood}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FoodRow({ food, isEditing, onEdit, onSave, onCancel, onDelete }) {
  const [editValues, setEditValues] = useState({ description: food.description, calories: food.calories.toString() })

  const handleSave = () => {
    onSave(food.id, editValues.description, editValues.calories)
  }

  const handleCancel = () => {
    setEditValues({ description: food.description, calories: food.calories.toString() })
    onCancel()
  }

  return (
    <div className="px-4 md:px-8 py-6 hover:bg-gray-700/30 transition-colors duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={editValues.description}
              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              placeholder="תיאור המזון"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={editValues.calories}
              onChange={(e) => setEditValues({ ...editValues, calories: e.target.value })}
              className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              placeholder="קלוריות"
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
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div>
              <span className="text-white font-medium text-lg">{food.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">קלוריות:</span>
                <span className="font-bold text-amber-400 text-xl">{food.calories}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  ערוך
                </button>
                <button
                  onClick={() => onDelete(food.id)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  מחק
                </button>
              </div>
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
            <div className="col-span-7">
              <span className="text-white font-medium">{food.description}</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-bold text-amber-400 text-lg">{food.calories}</span>
            </div>
            <div className="col-span-3 flex gap-3 justify-center">
              <button
                onClick={onEdit}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
              >
                ערוך
              </button>
              <button
                onClick={() => onDelete(food.id)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
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



