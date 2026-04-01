import 'dotenv/config';
import mongoose from 'mongoose';
import CheckIn from './models/CheckIn.js';

const SEED = [
  // Day 1 — March 1, rainy morning
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-01T07:50:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-01T08:15:00Z' },
  { weather:'rainy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-01T08:40:00Z' },
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-01T09:10:00Z' },
  { weather:'rainy',  commute:3, stress:4, mood:2, effort:2, timestamp:'2026-03-01T09:35:00Z' },
  // Day 2 — March 2, still rainy
  { weather:'rainy',  commute:4, stress:3, mood:2, effort:3, timestamp:'2026-03-02T07:55:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-02T08:25:00Z' },
  { weather:'rainy',  commute:5, stress:4, mood:1, effort:3, timestamp:'2026-03-02T08:50:00Z' },
  // Day 3 — March 3, cloudy but dry
  { weather:'cloudy', commute:2, stress:2, mood:3, effort:1, timestamp:'2026-03-03T08:00:00Z' },
  { weather:'cloudy', commute:2, stress:3, mood:3, effort:2, timestamp:'2026-03-03T08:30:00Z' },
  { weather:'cloudy', commute:3, stress:2, mood:4, effort:1, timestamp:'2026-03-03T09:00:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:3, effort:1, timestamp:'2026-03-03T09:25:00Z' },
  // Day 4 — March 4, sunny break
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-04T07:45:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-04T08:20:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-04T08:55:00Z' },
  { weather:'sunny',  commute:1, stress:2, mood:4, effort:1, timestamp:'2026-03-04T09:15:00Z' },
  { weather:'sunny',  commute:2, stress:1, mood:5, effort:1, timestamp:'2026-03-04T09:40:00Z' },
  // Day 5 — March 5, windy and cold
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-05T08:00:00Z' },
  { weather:'windy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-05T08:30:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-05T09:00:00Z' },
  // Day 6 — March 6, first snow
  { weather:'snowy',  commute:5, stress:4, mood:2, effort:3, timestamp:'2026-03-06T07:50:00Z' },
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:3, timestamp:'2026-03-06T08:20:00Z' },
  { weather:'snowy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-06T08:50:00Z' },
  { weather:'snowy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-06T09:15:00Z' },
  // Day 7 — March 7, sunny after snow
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-07T08:05:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-07T08:35:00Z' },
  { weather:'sunny',  commute:2, stress:1, mood:5, effort:1, timestamp:'2026-03-07T09:05:00Z' },
  // Day 8 — March 8, cloudy and grey
  { weather:'cloudy', commute:2, stress:3, mood:3, effort:2, timestamp:'2026-03-08T08:10:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-08T08:40:00Z' },
  // Day 9 — March 9, rainy again
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-09T07:55:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-09T08:25:00Z' },
  { weather:'rainy',  commute:4, stress:5, mood:1, effort:3, timestamp:'2026-03-09T08:55:00Z' },
  { weather:'rainy',  commute:3, stress:4, mood:2, effort:2, timestamp:'2026-03-09T09:20:00Z' },
  // Day 10 — March 10, windy with gusts
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-10T08:00:00Z' },
  { weather:'windy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-10T08:30:00Z' },
  { weather:'windy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-10T09:00:00Z' },
  // Day 11 — March 11, sunny and mild
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-11T07:50:00Z' },
  { weather:'sunny',  commute:1, stress:2, mood:4, effort:1, timestamp:'2026-03-11T08:20:00Z' },
  { weather:'sunny',  commute:2, stress:1, mood:5, effort:1, timestamp:'2026-03-11T08:50:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-11T09:15:00Z' },
  // Day 12 — March 12, cloudy and cool
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-12T08:05:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-12T08:35:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:3, effort:1, timestamp:'2026-03-12T09:05:00Z' },
  // Day 13 — March 13, heavy snow
  { weather:'snowy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-13T07:45:00Z' },
  { weather:'snowy',  commute:5, stress:4, mood:2, effort:3, timestamp:'2026-03-13T08:15:00Z' },
  { weather:'snowy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-13T08:45:00Z' },
  { weather:'snowy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-13T09:10:00Z' },
  // Day 14 — March 14, cloudy thaw
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-14T08:00:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-14T08:30:00Z' },
  // Day 15 — March 15, sunny spring day
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-15T07:50:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-15T08:20:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-15T08:50:00Z' },
  // Day 16 — March 16, windy morning
  { weather:'windy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-16T08:10:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-16T08:40:00Z' },
  // Day 17 — March 17, rainy and dark
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-17T07:55:00Z' },
  { weather:'rainy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-17T08:25:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:2, effort:2, timestamp:'2026-03-17T08:55:00Z' },
  // Day 18 — March 18, cloudy and mild
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-18T08:00:00Z' },
  { weather:'cloudy', commute:2, stress:3, mood:3, effort:1, timestamp:'2026-03-18T08:30:00Z' },
  { weather:'cloudy', commute:3, stress:2, mood:3, effort:2, timestamp:'2026-03-18T09:00:00Z' },
  // Day 19 — March 19, sunny and warm
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-19T07:45:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-19T08:15:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-19T08:45:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-19T09:10:00Z' },
  // Day 20 — March 20, snowy surprise
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:3, timestamp:'2026-03-20T08:00:00Z' },
  { weather:'snowy',  commute:5, stress:4, mood:2, effort:3, timestamp:'2026-03-20T08:30:00Z' },
  { weather:'snowy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-20T09:00:00Z' },
  // Day 21 — March 21, windy and brisk
  { weather:'windy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-21T08:05:00Z' },
  { weather:'windy',  commute:4, stress:3, mood:3, effort:2, timestamp:'2026-03-21T08:35:00Z' },
  // Day 22 — March 22, cloudy calm
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-22T08:10:00Z' },
  // Day 23 — March 23, rainy commute
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-23T07:50:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-23T08:20:00Z' },
  // Day 24 — March 24, sunny
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-24T08:00:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-24T08:30:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, timestamp:'2026-03-24T09:00:00Z' },
  // Day 25 — March 25, heavy wind
  { weather:'windy',  commute:5, stress:5, mood:1, effort:3, timestamp:'2026-03-25T08:00:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-25T08:30:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, timestamp:'2026-03-25T09:00:00Z' },
  // Day 26 — March 26, light snow
  { weather:'snowy',  commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-26T08:10:00Z' },
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:2, timestamp:'2026-03-26T08:45:00Z' },
  // Day 27 — March 27, cloudy
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-27T08:00:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-27T08:30:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:3, effort:1, timestamp:'2026-03-27T09:00:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, timestamp:'2026-03-27T09:25:00Z' },
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, timestamp:'2026-03-27T09:50:00Z' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await mongoose.model('CheckIn').countDocuments();
  if (existing > 0) {
    console.log(`Database already has ${existing} records. Skipping seed.`);
  } else {
    await mongoose.model('CheckIn').insertMany(SEED);
    console.log(`Seeded ${SEED.length} check-in records.`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
