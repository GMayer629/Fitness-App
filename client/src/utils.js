export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getDayType(dateStr, settings) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
  if (day === 5) return { type: 'friday', target: settings.friday_target };
  if (day === 0 || day === 6) return { type: 'weekend', target: settings.weekend_target };
  return { type: 'weekday', target: settings.weekday_target };
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getWeekDays(mondayStr) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
