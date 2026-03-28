export const STORAGE_KEY = 'weatherMoodData_v2';

export const MOOD_BRIGHTNESS = { 1: 0.5, 2: 0.65, 3: 0.8, 4: 0.92, 5: 1.0 };

export const WX_TINT = {
  sunny:  [240, 220, 160],
  cloudy: [180, 190, 200],
  rainy:  [130, 180, 210],
  snowy:  [200, 210, 230],
  windy:  [160, 200, 185],
};

export const WX_ORDER = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];

export const WX_NAME = { sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rainy', snowy: 'Snowy', windy: 'Windy' };

export const WX_STRESS_DESC  = { 1: 'Effortless', 2: 'Low', 3: 'Moderate Friction', 4: 'Elevated Pulse', 5: 'Overloaded' };
export const WX_COMMUTE_DESC = { 1: 'Effortless', 2: 'Minor Friction', 3: 'Some Delay', 4: 'Significant Delay', 5: 'Strenuous' };
export const MOOD_DESC       = { 1: 'Somber Outlook', 2: 'Low Energy', 3: 'Neutral State', 4: 'Positive Flow', 5: 'Radiant' };

export const WX_PARTICLE_COLORS = {
  sunny:  ['rgba(210,190,100,', 'rgba(230,210,130,', 'rgba(180,160,80,'],
  cloudy: ['rgba(150,160,170,', 'rgba(170,175,185,', 'rgba(120,130,145,'],
  rainy:  ['rgba(80,130,175,',  'rgba(100,155,195,', 'rgba(60,110,160,'],
  snowy:  ['rgba(180,195,215,', 'rgba(200,210,230,', 'rgba(160,175,200,'],
  windy:  ['rgba(110,165,145,', 'rgba(130,180,160,', 'rgba(90,148,128,'],
};

export const WX_BG = {
  sunny:  ['#e8e0c8', '#ddd8c0'],
  cloudy: ['#d8dde3', '#cdd5dc'],
  rainy:  ['#c8d8e8', '#bccfe0'],
  snowy:  ['#dce3ec', '#d0dce8'],
  windy:  ['#cdddd8', '#c0d4cc'],
};

export const SEED = [
  // Day 1 — March 18, rainy morning
  { weather:'rainy',  commute:4, stress:4, mood:2, effort:3, id:'aa1bb2cc3', timestamp:'2026-03-18T08:12:00Z' },
  { weather:'rainy',  commute:3, stress:3, mood:3, effort:2, id:'bb2cc3dd4', timestamp:'2026-03-18T08:45:00Z' },
  { weather:'rainy',  commute:5, stress:5, mood:1, effort:3, id:'cc3dd4ee5', timestamp:'2026-03-18T09:20:00Z' },
  // Day 2 — March 19, sunny and clear
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, id:'dd4ee5ff6', timestamp:'2026-03-19T08:05:00Z' },
  { weather:'sunny',  commute:2, stress:2, mood:4, effort:1, id:'ee5ff6gg7', timestamp:'2026-03-19T08:40:00Z' },
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, id:'ff6gg7hh8', timestamp:'2026-03-19T09:15:00Z' },
  // Day 3 — March 20, snowy commute
  { weather:'snowy',  commute:5, stress:4, mood:2, effort:3, id:'gg7hh8ii9', timestamp:'2026-03-20T08:10:00Z' },
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:3, id:'hh8ii9jj0', timestamp:'2026-03-20T08:50:00Z' },
  // Day 4 — March 21, windy but manageable
  { weather:'windy',  commute:3, stress:3, mood:3, effort:2, id:'ii9jj0kk1', timestamp:'2026-03-21T08:15:00Z' },
  // Day 5 — March 22, overcast and calm
  { weather:'cloudy', commute:2, stress:2, mood:4, effort:1, id:'jj0kk1ll2', timestamp:'2026-03-22T08:30:00Z' },
  // Day 6 — March 23, cloudy turning to drizzle
  { weather:'cloudy', commute:2, stress:3, mood:3, effort:2, id:'kk1ll2mm3', timestamp:'2026-03-23T08:00:00Z' },
  { weather:'cloudy', commute:3, stress:3, mood:3, effort:2, id:'ll2mm3nn4', timestamp:'2026-03-23T08:35:00Z' },
  // Day 7 — March 24, beautiful sunny day
  { weather:'sunny',  commute:1, stress:1, mood:5, effort:1, id:'mm3nn4oo5', timestamp:'2026-03-24T07:50:00Z' },
  { weather:'sunny',  commute:1, stress:2, mood:4, effort:1, id:'nn4oo5pp6', timestamp:'2026-03-24T08:25:00Z' },
  { weather:'sunny',  commute:2, stress:1, mood:5, effort:1, id:'oo5pp6qq7', timestamp:'2026-03-24T09:10:00Z' },
  // Day 8 — March 25, heavy wind and rain
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, id:'pp6qq7rr8', timestamp:'2026-03-25T08:15:00Z' },
  { weather:'windy',  commute:5, stress:5, mood:1, effort:3, id:'qq7rr8ss9', timestamp:'2026-03-25T08:50:00Z' },
  { weather:'windy',  commute:4, stress:4, mood:2, effort:3, id:'rr8ss9tt0', timestamp:'2026-03-25T09:20:00Z' },
  // Day 9 — March 26, light snow
  { weather:'snowy',  commute:3, stress:3, mood:3, effort:2, id:'ss9tt0uu1', timestamp:'2026-03-26T08:10:00Z' },
  { weather:'snowy',  commute:4, stress:3, mood:2, effort:2, id:'tt0uu1vv2', timestamp:'2026-03-26T08:55:00Z' },
];
