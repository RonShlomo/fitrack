'use client'
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Select from 'react-select';


export default function NutritionPage() {
  // state
  const [values, setValues] = useState([]);     // nutrition_values (per 100g)
  const [log, setLog] = useState([]);           // logged entries (computed)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // form state
  const [selectedId, setSelectedId] = useState('');
  const [grams, setGrams] = useState('');

  // sorting helper for nicer dropdown
  const collator = useMemo(() => new Intl.Collator(['he','en'], { sensitivity: 'base', numeric: true }), []);
  const sortedValues = useMemo(
    () => [...values].sort((a,b)=>collator.compare((a.name??'').trim(), (b.name??'').trim())),
    [values, collator]
  );

  // load values (source list) and log (user entries)
  const loadAll = async () => {
    try {
      setLoading(true);
      const [vRes, lRes] = await Promise.all([
        fetch('/api/nutrition-values'),
        fetch('/api/nutrition')
      ]);
      const vJson = await vRes.json();
      const lJson = await lRes.json();
      if (vJson.success) setValues(vJson.data); else setError(vJson.error || 'שגיאה בטעינת רשימת פריטים');
      if (lJson.success) setLog(lJson.data); else setError(lJson.error || 'שגיאה בטעינת יומן');
    } catch {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadAll(); }, []);

  // add entry (compute server-side)
  const addEntry = async () => {
    if (!selectedId) return alert('בחר פריט מהרשימה');
    const g = Number(grams);
    if (!g || g <= 0) return alert('הכנס משקל בגרמים (> 0)');

    const res = await fetch('/api/nutrition', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ itemId: selectedId, grams: g })
    });
    const j = await res.json();
    if (j.success) {
      setLog(prev => [j.data, ...prev]);
      setGrams('');
    } else {
      alert(j.error || 'שגיאה בהוספה');
    }
  };

  // delete entry
  const deleteEntry = async (id) => {
    if (!confirm('למחוק רשומה זו?')) return;
    const res = await fetch(`/api/nutrition?id=${id}`, { method:'DELETE' });
    const j = await res.json();
    if (j.success) setLog(prev => prev.filter(x => x._id !== id));
    else alert(j.error || 'שגיאה במחיקה');
  };

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
              <span>{error}</span>
              <button onClick={()=>{ setError(null); loadAll(); }} className="bg-amber-600 px-4 py-2 rounded-lg">נסה שוב</button>
            </div>
          </div>
        )}

        {/* Add form: select base item + grams */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">בחר פריט (מתוך ערכים תזונתיים)</label>
              <Select
              options={sortedValues.map(v => ({ value: v._id, label: v.name }))}
              value={sortedValues.find(v => v._id === selectedId) ? { value: selectedId, label: sortedValues.find(v => v._id === selectedId).name } : null}
              onChange={option => setSelectedId(option?.value || '')}
              className="text-black"
              placeholder="בחר פריט..."
              isSearchable
              />
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

        {/* Log list */}
        {/* List */}
<div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
  {/* Header */}
  <div className="hidden md:grid bg-gray-700/30 px-4 md:px-8 py-3 grid-cols-12 gap-4 text-sm font-bold text-gray-300">
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
        <div
          key={it._id}
          className="px-4 md:px-8 py-5 flex flex-col md:grid md:grid-cols-12 md:gap-4"
        >
          {/* Mobile layout */}
          <div className="md:hidden mb-3">
            <div className="text-lg font-semibold text-white">{it.name}</div>
            <div className="text-sm text-gray-400 mt-1">
              {it.calories} קק"ל • {it.protein} חלבון
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:block md:col-span-6">{it.name}</div>
          <div className="hidden md:block md:col-span-3 text-center text-green-300 font-semibold">
            {it.calories}
          </div>
          <div className="hidden md:block md:col-span-3 text-center text-green-300 font-semibold">
            {it.protein}
          </div>

          <div className="mt-3 md:mt-0 flex justify-end gap-2">
            <button
              onClick={() => setEditingId(it._id)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm md:text-base"
            >
              ערוך
            </button>
            <button
              onClick={() => deleteItem(it._id)}
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm md:text-base"
            >
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
  );
}
