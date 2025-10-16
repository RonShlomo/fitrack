// app/api/nutrition/route.js
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

const DB_NAME = 'fitrack';           // change if your db name is different
const LOG_COLL = 'nutritionLog';     // entries the user adds
const VALUES_COLL = 'nutritionValues'; // source list (per 100g)

async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// GET /api/nutrition  -> list all logged entries (latest first)
export async function GET() {
  const db = await getDb();
  const items = await db.collection(LOG_COLL)
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return json({ success: true, data: items });
}

// POST /api/nutrition  { itemId, grams }
export async function POST(req) {
  const db = await getDb();
  const { itemId, grams } = await req.json();

  if (!itemId || isNaN(Number(grams)) || Number(grams) <= 0) {
    return json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  // fetch base (per 100g) item from nutrition_values
  const base = await db.collection(VALUES_COLL).findOne({ _id: new ObjectId(itemId) });
  if (!base) return json({ success: false, error: 'Base item not found' }, { status: 404 });

  const g = Number(grams);
  const factor = g / 100;

  // compute from per-100g values
  const calories = Math.round((Number(base.calories) || 0) * factor);
  const protein = Number(((Number(base.protein) || 0) * factor).toFixed(1));

  const doc = {
    itemId: base._id,
    name: base.name,         // denormalize so history is stable
    grams: g,
    calories,
    protein,
    createdAt: new Date()
  };

  const r = await db.collection(LOG_COLL).insertOne(doc);
  return json({ success: true, data: { ...doc, _id: r.insertedId } });
}

// DELETE /api/nutrition?id=<entryId>
export async function DELETE(req) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  const r = await db.collection(LOG_COLL).deleteOne({ _id: new ObjectId(id) });
  if (r.deletedCount === 0) return json({ success: false, error: 'Not found' }, { status: 404 });

  return json({ success: true, data: true });
}
