const BASE = '/api';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Food
  getFood: (date) => req('GET', `/food?date=${date}`),
  addFood: (entry) => req('POST', '/food', entry),
  deleteFood: (id) => req('DELETE', `/food/${id}`),
  repeatPreviousDay: (date) => req('POST', '/food/repeat-previous', { date }),
  getWeeklyFood: (weekStart) => req('GET', `/food/weekly?weekStart=${weekStart}`),
  getWeeklyMultiFood: (weeksBack = 4) => req('GET', `/food/weekly-multi?weeksBack=${weeksBack}`),

  // Meal bank
  getMealBank: () => req('GET', '/meal-bank'),
  addMealBank: (meal) => req('POST', '/meal-bank', meal),
  deleteMealBank: (id) => req('DELETE', `/meal-bank/${id}`),
  addMealBankToLog: (id, date) => req('POST', `/meal-bank/${id}/add`, { date }),

  // Lifts
  getLifts: (date) => req('GET', `/lifts?date=${date}`),
  addLift: (entry) => req('POST', '/lifts', entry),
  deleteLift: (id) => req('DELETE', `/lifts/${id}`),
  getLastSession: (exercise) => req('GET', `/lifts/last-session/${encodeURIComponent(exercise)}`),
  getProgression: (exercise) => req('GET', `/lifts/progression/${encodeURIComponent(exercise)}`),
  getLiftsWeeklyCount: (weekStart) => req('GET', `/lifts/weekly-count?weekStart=${weekStart}`),

  // Weigh-ins
  getWeighIns: (limit = 100) => req('GET', `/weigh-ins?limit=${limit}`),
  getLatestWeighIn: () => req('GET', '/weigh-ins/latest'),
  addWeighIn: (entry) => req('POST', '/weigh-ins', entry),

  // Checklist
  getChecklist: (date) => req('GET', `/checklist?date=${date}`),
  addChecklist: (item, date) => req('POST', '/checklist', { item, date }),
  deleteChecklist: (item, date) => req('DELETE', `/checklist/${encodeURIComponent(item)}/${date}`),
  getWeeklyChecklist: (weekStart) => req('GET', `/checklist/weekly?weekStart=${weekStart}`),

  // Sport
  getSport: (date) => req('GET', `/sport?date=${date}`),
  addSport: (entry) => req('POST', '/sport', entry),
  deleteSport: (id) => req('DELETE', `/sport/${id}`),
  getSportWeeklySummary: (weekStart) => req('GET', `/sport/weekly-summary?weekStart=${weekStart}`),

  // Settings
  getSettings: () => req('GET', '/settings'),
  updateSettings: (settings) => req('PUT', '/settings', settings),

  // Dashboard
  getConsistency: (weekStart) => req('GET', `/dashboard/consistency?weekStart=${weekStart}`),
};
