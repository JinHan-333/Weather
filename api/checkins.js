import mongoose from 'mongoose';

/* ── Cached connection (survives across warm invocations) ── */
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/* ── Model ── */
const checkInSchema = new mongoose.Schema({
  weather:   { type: String, enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'], required: true },
  commute:   { type: Number, min: 1, max: 5, required: true },
  stress:    { type: Number, min: 1, max: 5, required: true },
  mood:      { type: Number, min: 1, max: 5, required: true },
  effort:    { type: Number, min: 1, max: 3, required: true },
  timestamp: { type: Date, default: Date.now },
});

const CheckIn = mongoose.models.CheckIn || mongoose.model('CheckIn', checkInSchema);

/* ── Handler ── */
export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const docs = await CheckIn.find().sort({ timestamp: 1 }).lean();
    const checkins = docs.map(d => ({
      id: d._id.toString(),
      weather: d.weather,
      commute: d.commute,
      stress: d.stress,
      mood: d.mood,
      effort: d.effort,
      timestamp: d.timestamp.toISOString(),
    }));
    return res.json(checkins);
  }

  if (req.method === 'POST') {
    const { weather, commute, stress, mood, effort } = req.body;
    const doc = await CheckIn.create({ weather, commute, stress, mood, effort });
    return res.status(201).json({
      id: doc._id.toString(),
      weather: doc.weather,
      commute: doc.commute,
      stress: doc.stress,
      mood: doc.mood,
      effort: doc.effort,
      timestamp: doc.timestamp.toISOString(),
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
