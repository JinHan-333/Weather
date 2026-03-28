import { STORAGE_KEY, SEED } from './constants';

export function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveData(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

const SEED_VERSION_KEY = 'weatherMoodSeedVersion_v2';
const CURRENT_SEED_VERSION = 6;

export function ensureSeedData() {
  const version = parseInt(localStorage.getItem(SEED_VERSION_KEY)) || 0;
  if (version < CURRENT_SEED_VERSION) {
    saveData([...SEED]);
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  }
  return loadData();
}
