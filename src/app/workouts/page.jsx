'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function WorkoutsPage() {
  const [exercises, setExercises] = useState([])
  const [newExercise, setNewExercise] = useState({ description: '', weight: '' })
  const [editingId, setEditingId] = useState(null)

  // הוספת תרגיל חדש
  const addExercise = () => {
    if (newExercise.description.trim() && newExercise.weight.trim()) {
      const exercise = {
        id: Date.now(),
        description: newExercise.description,
        weight: parseFloat(newExercise.weight) || 0
      }
      setExercises([...exercises, exercise])
      setNewExercise({ description: '', weight: '' })
    }
  }

  // מחיקת תרגיל
  const deleteExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id))
  }

  // שמירת עריכה
  const saveEdit = (id, description, weight) => {
    setExercises(exercises.map(ex => 
      ex.id === id 
        ? { ...ex, description, weight: parseFloat(weight) || 0 }
        : ex
    ))
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזרה לדף הבית
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">
              מעקב אימונים 💪
            </h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Add New Exercise Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">הוסף תרגיל חדש</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                תיאור התרגיל
              </label>
              <input
                type="text"
                value={newExercise.description}
                onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                placeholder="לדוגמה: בנץ' פרס עליון"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                משקל (ק״ג)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newExercise.weight}
                  onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})}
                  placeholder="80"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addExercise}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  הוסף
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">רשימת התרגילים</h2>
            {exercises.length > 0 && (
              <p className="text-gray-600 text-sm mt-1">סה״כ {exercises.length} תרגילים</p>
            )}
          </div>

          {exercises.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏋️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">עדיין לא הוספת תרגילים</h3>
              <p className="text-gray-500">התחל בהוספת התרגיל הראשון שלך למעלה</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-7">תיאור</div>
                <div className="col-span-2 text-center">משקל (ק״ג)</div>
                <div className="col-span-3 text-center">פעולות</div>
              </div>

              {/* Exercise Rows */}
              {exercises.map((exercise) => (
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

        {/* Summary Stats */}
        {exercises.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{exercises.length}</div>
              <div className="text-gray-600">תרגילים באימון</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(exercises.reduce((sum, ex) => sum + ex.weight, 0))}
              </div>
              <div className="text-gray-600">סה״כ משקל (ק״ג)</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {exercises.length > 0 ? Math.round(exercises.reduce((sum, ex) => sum + ex.weight, 0) / exercises.length) : 0}
              </div>
              <div className="text-gray-600">משקל ממוצע (ק״ג)</div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

// קומפוננט נפרד לשורת תרגיל
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
    <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
      {isEditing ? (
        <>
          <div className="col-span-7">
            <input
              type="text"
              value={editValues.description}
              onChange={(e) => setEditValues({...editValues, description: e.target.value})}
              className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              value={editValues.weight}
              onChange={(e) => setEditValues({...editValues, weight: e.target.value})}
              className="w-full px-3 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-3 flex gap-2 justify-center">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="col-span-7">
            <span className="text-gray-900">{exercise.description}</span>
          </div>
          <div className="col-span-2 text-center">
            <span className="font-medium text-blue-600">{exercise.weight}</span>
          </div>
          <div className="col-span-3 flex gap-2 justify-center">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              ערוך
            </button>
            <button
              onClick={() => onDelete(exercise.id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  )
}