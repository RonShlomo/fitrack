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

// POST (?dateKey=YYYY-MM-DD) -> aggregate that day; only write if there were entries
export async function POST(req) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const paramKey = searchParams.get('dateKey');
  const targetKey = paramKey || dateKeyTZ();

  // 1) Read items for that day
  const items = await db.collection(LOG_COLL).find({ dateKey: targetKey }).toArray();
  const hadItems = items.length > 0;

  // 2) If no items, and no existing stat doc, DO NOTHING (avoid recreating after manual delete)
  if (!hadItems) {
    const existing = await db.collection(STATS_COLL).findOne({ dateKey: targetKey });
    if (!existing) {
      return json({ success: true, closed: false, reason: 'no-items' });
    }
    // If there IS an existing stat row and no items in the log, we also leave it as-is.
    return json({ success: true, closed: false, reason: 'no-items-existing-stat-preserved' });
  }

  // 3) Aggregate totals when there ARE items
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

  // 4) Upsert stats for that day (idempotent when there WERE items)
  await db.collection(STATS_COLL).updateOne(
    { dateKey: targetKey },
    { $set: statDoc },
    { upsert: true }
  );

  // 5) Clear that day's log
  await db.collection(LOG_COLL).deleteMany({ dateKey: targetKey });

  return json({ success: true, closed: true, data: statDoc });
}
