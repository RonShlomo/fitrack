// app/api/nutrition-values/route.js
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

const DB_NAME = 'fitrack';               // <- change if you use a different DB
const COLL = 'nutritionValues';

async function getCol() {
  const client = await clientPromise;
  const col = client.db(DB_NAME).collection(COLL);
  // Ensure unique index once (prevents duplicate names, case-insensitive)
  await col.createIndex({ nameLower: 1 }, { unique: true });
  return col;
}

export async function GET() {
  const col = await getCol();
  const items = await col.find().sort({ nameLower: 1 }).toArray();
  return json({ success: true, data: items });
}

export async function POST(req) {
  const col = await getCol();
  const { name, calories, protein } = await req.json();

  if (!name?.trim() || isNaN(Number(calories)) || isNaN(Number(protein))) {
    return json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const doc = {
    name: name.trim(),
    nameLower: name.trim().toLowerCase(),
    calories: Number(calories),
    protein: Number(protein),
  };

  try {
    const r = await col.insertOne(doc);
    return json({ success: true, data: { ...doc, _id: r.insertedId } });
  } catch (e) {
    if (e?.code === 11000) return json({ success: false, error: 'Duplicate name' }, { status: 409 });
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  const col = await getCol();
  const { id, name, calories, protein } = await req.json();

  if (!id || !name?.trim() || isNaN(Number(calories)) || isNaN(Number(protein))) {
    return json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const update = {
    $set: {
      name: name.trim(),
      nameLower: name.trim().toLowerCase(),
      calories: Number(calories),
      protein: Number(protein),
    },
  };

  try {
    const r = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: 'after' }
    );
    if (!r.value) return json({ success: false, error: 'Not found' }, { status: 404 });
    return json({ success: true, data: r.value });
  } catch (e) {
    if (e?.code === 11000) return json({ success: false, error: 'Duplicate name' }, { status: 409 });
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const col = await getCol();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  const r = await col.deleteOne({ _id: new ObjectId(id) });
  if (r.deletedCount === 0) return json({ success: false, error: 'Not found' }, { status: 404 });
  return json({ success: true, data: true });
}
