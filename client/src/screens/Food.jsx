import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useApp } from '../AppContext';
import { getMondayOfWeek, getWeekDays, getDayType, formatDate } from '../utils';
import { api } from '../api';

const card = { background: '#1E2328', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid #2A2F38' };
const input = { background: '#252A31', border: '1px solid #3A4048', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 14, fontFamily: 'Archivo', width: '100%' };
const btn = (primary) => ({
  background: primary ? '#FF6B35' : '#252A31', border: primary ? 'none' : '1px solid #3A4048',
  color: '#fff', borderRadius: 8, padding: '10px 16px', fontFamily: 'Barlow Condensed', fontSize: 16, cursor: 'pointer', fontWeight: 600
});

export default function Food() {
  const { activeDate, settings } = useApp();
  const weekStart = getMondayOfWeek(activeDate);
  const weekDays = getWeekDays(weekStart);

  const [food, setFood] = useState([]);
  const [mealBank, setMealBank] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [form, setForm] = useState({ name: '', calories: '', protein: '' });
  const [saveToBank, setSaveToBank] = useState(false);

  const load = () => {
    api.getFood(activeDate).then(setFood).catch(() => {});
    api.getMealBank().then(setMealBank).catch(() => {});
    api.getWeeklyFood(weekStart).then(setWeeklyData).catch(() => {});
  };

  useEffect(() => { load(); }, [activeDate]);

  const { target } = getDayType(activeDate, settings);
  const totalCals = food.reduce((s, f) => s + f.calories, 0);
  const totalProtein = food.reduce((s, f) => s + f.protein, 0);

  const chartData = weekDays.map(day => {
    const dayEntry = weeklyData.find(d => d.date === day);
    const dayTarget = getDayType(day, settings).target;
    const label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    return { day: label, date: day, actual: dayEntry?.calories || 0, target: dayTarget };
  });

  const addFood = async (e) => {
    e.preventDefault();
    if (!form.name || !form.calories) return;
    await api.addFood({ name: form.name, calories: parseInt(form.calories), protein: parseInt(form.protein) || 0, date: activeDate });
    if (saveToBank) {
      await api.addMealBank({ name: form.name, calories: parseInt(form.calories), protein: parseInt(form.protein) || 0 });
    }
    setForm({ name: '', calories: '', protein: '' });
    setSaveToBank(false);
    load();
  };

  const addFromBank = async (meal) => {
    await api.addMealBankToLog(meal.id, activeDate);
    load();
  };

  const repeatPrevious = async () => {
    await api.repeatPreviousDay(activeDate);
    load();
  };

  const deleteFood = async (id) => {
    await api.deleteFood(id);
    load();
  };

  const deleteMeal = async (id) => {
    await api.deleteMealBank(id);
    load();
  };

  const pct = Math.min(100, (totalCals / target) * 100);

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Header */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1 }}>
            {getDayType(activeDate, settings).type.toUpperCase()} — {target} CAL TARGET
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, color: totalCals > target ? '#FF6B35' : '#5FBF7E' }}>
            {totalCals} cal · {totalProtein}g
          </div>
        </div>
        <div style={{ background: '#2A2F38', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: totalCals > target ? '#FF6B35' : '#5FBF7E', width: `${pct}%`, borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
          <span>{totalCals} eaten</span>
          <span>{target - totalCals} remaining</span>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>THIS WEEK</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} barGap={2}>
            <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1E2328', border: 'none', fontSize: 12 }}
              formatter={(v, n) => [v, n === 'actual' ? 'Calories' : 'Budget']}
            />
            <Bar dataKey="target" fill="#2A2F38" radius={[4, 4, 0, 0]} name="target" />
            <Bar dataKey="actual" radius={[4, 4, 0, 0]} name="actual">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.date === activeDate ? '#FF6B35' : entry.actual > entry.target ? '#FF6B3588' : '#5FBF7E88'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Repeat previous day */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={repeatPrevious} style={{ ...btn(false), width: '100%' }}>
          ↻ Repeat Previous Day
        </button>
      </div>

      {/* Meal bank */}
      {mealBank.length > 0 && (
        <div style={card}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>MEAL BANK</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mealBank.map(meal => (
              <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => addFromBank(meal)}
                  style={{
                    background: '#252A31', border: '1px solid #3A4048', borderRadius: 20,
                    color: '#fff', padding: '6px 14px', fontFamily: 'Archivo', fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {meal.name} <span style={{ color: '#FF6B35' }}>{meal.calories}</span>
                </button>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add meal form */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>ADD MEAL</div>
        <form onSubmit={addFood}>
          <div style={{ marginBottom: 8 }}>
            <input
              style={input}
              placeholder="Meal name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              style={input}
              type="number"
              placeholder="Calories"
              value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
            />
            <input
              style={input}
              type="number"
              placeholder="Protein (g)"
              value={form.protein}
              onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <input type="checkbox" id="saveBank" checked={saveToBank} onChange={e => setSaveToBank(e.target.checked)} style={{ accentColor: '#FF6B35' }} />
            <label htmlFor="saveBank" style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Save to meal bank</label>
          </div>
          <button type="submit" style={{ ...btn(true), width: '100%' }}>Add Meal</button>
        </form>
      </div>

      {/* Food log */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>TODAY'S LOG</div>
        {food.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: 13 }}>No entries yet</div>
        ) : (
          food.map(entry => (
            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2A2F38' }}>
              <div>
                <div style={{ fontSize: 14 }}>{entry.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{entry.protein}g protein</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: 18, color: '#FF6B35' }}>{entry.calories}</span>
                <button onClick={() => deleteFood(entry.id)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
