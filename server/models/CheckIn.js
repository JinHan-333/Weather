import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  weather:   { type: String, enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'], required: true },
  commute:   { type: Number, min: 1, max: 5, required: true },
  stress:    { type: Number, min: 1, max: 5, required: true },
  mood:      { type: Number, min: 1, max: 5, required: true },
  effort:    { type: Number, min: 1, max: 3, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('CheckIn', checkInSchema);
