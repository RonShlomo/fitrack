import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

const DB_NAME = 'fitrack';
const LOG_COLL = 'nutritionLog';
const VALUES_COLL = 'nutritionValues';
const TZ = 'Asia/Jerusalem';

// YYYY-MM-DD in Asia/Jerusalem
function dateKeyTZ(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// GET -> return ONLY today's entries
export async function GET() {
  const db = await getDb();
  const today = dateKeyTZ();
  const items = await db.collection(LOG_COLL)
    .find({ dateKey: today })
    .sort({ createdAt: -1 })
    .toArray();
  return json({ success: true, data: items });
}

// POST { itemId, grams } -> compute from per-100g base
export async function POST(req) {
  const db = await getDb();
  const { itemId, grams } = await req.json();
  if (!itemId || isNaN(Number(grams)) || Number(grams) <= 0) {
    return json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const base = await db.collection(VALUES_COLL).findOne({ _id: new ObjectId(itemId) });
  if (!base) return json({ success: false, error: 'Base item not found' }, { status: 404 });

  const g = Number(grams);
  const factor = g / 100;
  const calories = Math.round((Number(base.calories) || 0) * factor);
  const protein  = Number(((Number(base.protein)  || 0) * factor).toFixed(1));

  const doc = {
    itemId: base._id,
    name: base.name,
    grams: g,
    calories,
    protein,
    dateKey: dateKeyTZ(),
    createdAt: new Date(),
  };

  const r = await db.collection(LOG_COLL).insertOne(doc);
  return json({ success: true, data: { ...doc, _id: r.insertedId } });
}

// DELETE ?id=... -> delete one entry
export async function DELETE(req) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  const r = await db.collection(LOG_COLL).deleteOne({ _id: new ObjectId(id) });
  if (r.deletedCount === 0) return json({ success: false, error: 'Not found' }, { status: 404 });
  return json({ success: true, data: true });
}
