const API = '/api/checkins';

export async function loadData() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.error('Failed to load check-ins:', err);
    return [];
  }
}

export async function saveCheckIn(entry) {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.error('Failed to save check-in:', err);
    return null;
  }
}
