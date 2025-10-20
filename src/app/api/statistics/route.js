import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

const DB_NAME = 'fitrack';
const STATS_COLL = 'statistics';

// GET -> list all (newest first)
export async function GET() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const items = await db.collection(STATS_COLL).find().sort({ dateKey: -1 }).toArray();
  return json({ success: true, data: items });
}

// PUT -> update one stat: { id, calories, protein }
export async function PUT(req) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const { id, calories, protein } = await req.json();

  if (!id || isNaN(Number(calories)) || isNaN(Number(protein))) {
    return json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const r = await db.collection(STATS_COLL).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { calories: Number(calories), protein: Number(protein) } },
    { returnDocument: 'after' }
  );

  if (!r.value) return json({ success: false, error: 'Not found' }, { status: 404 });
  return json({ success: true, data: r.value });
}

// DELETE -> /api/statistics?id=<id>
export async function DELETE(req) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return json({ success: false, error: 'Missing id' }, { status: 400 });

  const r = await db.collection(STATS_COLL).deleteOne({ _id: new ObjectId(id) });
  if (r.deletedCount === 0) return json({ success: false, error: 'Not found' }, { status: 404 });
  return json({ success: true, data: true });
}
