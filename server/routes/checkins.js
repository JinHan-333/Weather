import { Router } from 'express';
import CheckIn from '../models/CheckIn.js';

const router = Router();

// GET /api/checkins — return all check-ins, oldest first
router.get('/', async (req, res) => {
  try {
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
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkins — create a new check-in
router.post('/', async (req, res) => {
  try {
    const { weather, commute, stress, mood, effort } = req.body;
    const doc = await CheckIn.create({ weather, commute, stress, mood, effort });
    res.status(201).json({
      id: doc._id.toString(),
      weather: doc.weather,
      commute: doc.commute,
      stress: doc.stress,
      mood: doc.mood,
      effort: doc.effort,
      timestamp: doc.timestamp.toISOString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
