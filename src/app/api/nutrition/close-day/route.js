import clientPromise from '@/lib/mongodb';

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

const DB_NAME = 'fitrack';
const LOG_COLL = 'nutritionLog';
const STATS_COLL = 'statistics';
const TZ = 'Asia/Jerusalem';

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

// POST (?dateKey=YYYY-MM-DD) -> aggregate that day, upsert into statistics, clear that day's log
export async function POST(req) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const paramKey = searchParams.get('dateKey');
  const targetKey = paramKey || dateKeyTZ();

  const items = await db.collection(LOG_COLL).find({ dateKey: targetKey }).toArray();

  const totals = items.reduce((acc, x) => {
    acc.calories += Number(x?.calories) || 0;
    acc.protein  += Number(x?.protein)  || 0;
    return acc;
  }, { calories: 0, protein: 0 });

  const statDoc = {
    dateKey: targetKey,
    calories: totals.calories,
    protein: Number(totals.protein.toFixed(1)),
    createdAt: new Date(),
  };

  // Upsert so calling multiple times is safe (idempotent)
  await db.collection(STATS_COLL).updateOne(
    { dateKey: targetKey },
    { $set: statDoc },
    { upsert: true }
  );

  // Clear that day's log
  await db.collection(LOG_COLL).deleteMany({ dateKey: targetKey });

  return json({ success: true, data: statDoc });
}
