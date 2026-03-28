export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDominantWeather(data) {
  const wxCount = {};
  data.forEach(e => wxCount[e.weather] = (wxCount[e.weather] || 0) + 1);
  return data.length ? Object.entries(wxCount).sort((a, b) => b[1] - a[1])[0][0] : 'cloudy';
}

export function getAverages(data) {
  const n = data.length;
  if (n === 0) return { commute: 0, stress: 0, mood: 0 };
  return {
    commute: data.reduce((s, e) => s + e.commute, 0) / n,
    stress: data.reduce((s, e) => s + e.stress, 0) / n,
    mood: data.reduce((s, e) => s + e.mood, 0) / n,
  };
}
