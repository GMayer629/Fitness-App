import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

function getWeekDates(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  const mon = new Date(date)
  mon.setDate(date.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Food() {
  const { activeDate, settings } = useApp()
  const [food, setFood] = useState([])
  const [mealBank, setMealBank] = useState([])
  const [weekCalories, setWeekCalories] = useState([])
  const [form, setForm] = useState({ name: '', calories: '', protein: '', saveToBank: false })
  const [loading, setLoading] = useState(false)

  const getDayType = () => {
    const d = new Date(activeDate + 'T00:00:00')
    const dow = d.getDay()
    if (dow === 5) return { label: 'Friday', target: settings.friday_target }
    if (dow === 0 || dow === 6) return { label: 'Weekend', target: settings.weekend_target }
    return { label: 'Weekday', target: settings.weekday_target }
  }

  const fetchFood = useCallback(async () => {
    const res = await fetch(`/api/food?date=${activeDate}`)
    setFood(await res.json())
  }, [activeDate])

  const fetchMealBank = async () => {
    const res = await fetch('/api/meal-bank')
    setMealBank(await res.json())
  }

  const fetchWeekCalories = useCallback(async () => {
    const weekDates = getWeekDates(activeDate)
    const data = []
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`/api/food?date=${weekDates[i]}`)
      const items = await res.json()
      data.push({ day: DAY_LABELS[i], date: weekDates[i], calories: items.reduce((s, f) => s + f.calories, 0) })
    }
    setWeekCalories(data)
  }, [activeDate])

  useEffect(() => {
    fetchFood()
    fetchMealBank()
    fetchWeekCalories()
  }, [fetchFood, fetchWeekCalories])

  const addMealFromBank = async (meal) => {
    await fetch(`/api/meal-bank/${meal.id}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: activeDate }),
    })
    fetchFood()
    fetchWeekCalories()
  }

  const deleteMeal = async (id) => {
    await fetch(`/api/food/${id}`, { method: 'DELETE' })
    fetchFood()
    fetchWeekCalories()
  }

  const deleteMealBank = async (id) => {
    await fetch(`/api/meal-bank/${id}`, { method: 'DELETE' })
    fetchMealBank()
  }

  const handleRepeatYesterday = async () => {
    const yesterday = new Date(activeDate + 'T00:00:00')
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    const res = await fetch(`/api/food?date=${yStr}`)
    const items = await res.json()
    for (const item of items) {
      await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, calories: item.calories, protein: item.protein, date: activeDate }),
      })
    }
    fetchFood()
    fetchWeekCalories()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.calories) return
    setLoading(true)
    await fetch('/api/food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, calories: parseInt(form.calories), protein: parseInt(form.protein) || 0, date: activeDate }),
    })
    if (form.saveToBank) {
      await fetch('/api/meal-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, calories: parseInt(form.calories), protein: parseInt(form.protein) || 0 }),
      })
      fetchMealBank()
    }
    setForm({ name: '', calories: '', protein: '', saveToBank: false })
    setLoading(false)
    fetchFood()
    fetchWeekCalories()
  }

  const { label, target } = getDayType()
  const totalCal = food.reduce((s, f) => s + f.calories, 0)
  const pct = Math.min(100, (totalCal / target) * 100)

  const cardStyle = { background: '#1E2328', borderRadius: 12, padding: 16, marginBottom: 16 }
  const sectionTitle = {
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
    color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  }
  const inputStyle = {
    background: '#14171C', border: '1px solid #3D4149', color: 'white',
    borderRadius: 8, padding: '10px 12px', fontSize: 15, width: '100%',
    fontFamily: 'Archivo, sans-serif',
  }

  return (
    <div>
      {/* Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700 }}>{label} — {target} cal</span>
          <span style={{ color: totalCal > target ? '#EF4444' : '#5FBF7E', fontWeight: 600 }}>{totalCal} / {target}</span>
        </div>
        <div style={{ background: '#3D4149', borderRadius: 6, height: 10 }}>
          <div style={{
            height: 10, borderRadius: 6,
            background: totalCal > target ? '#EF4444' : '#FF6B35',
            width: `${pct}%`, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Weekly chart */}
      <div style={cardStyle}>
        <div style={sectionTitle}>This Week</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weekCalories} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} width={40} />
            <Tooltip contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }} />
            <ReferenceLine y={target} stroke="#FF6B35" strokeDasharray="4 2" />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
              {weekCalories.map((entry) => (
                <Cell key={entry.date} fill={entry.date === activeDate ? '#FF6B35' : '#4B5563'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Repeat yesterday */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleRepeatYesterday}
          style={{
            width: '100%', background: '#3D4149', color: 'white', border: 'none',
            borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Barlow Condensed',
          }}
        >
          Repeat Yesterday
        </button>
      </div>

      {/* Meal bank */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Meal Bank</div>
        {mealBank.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>No saved meals yet</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mealBank.map(meal => (
              <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => addMealFromBank(meal)}
                  style={{
                    background: '#3D4149', color: 'white', border: 'none',
                    borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {meal.name} ({meal.calories}cal)
                </button>
                <button
                  onClick={() => deleteMealBank(meal.id)}
                  style={{
                    background: 'none', color: '#9CA3AF', border: 'none',
                    cursor: 'pointer', fontSize: 14, padding: '4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food log */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Today's Log</div>
        {food.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Nothing logged yet</p>
        ) : (
          food.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid #2D3139',
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.calories} cal · {item.protein}g protein</div>
              </div>
              <button
                onClick={() => deleteMeal(item.id)}
                style={{ background: 'none', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>
          ))
        )}
        {food.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #3D4149', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9CA3AF', fontSize: 14 }}>Total</span>
            <span style={{ fontWeight: 600 }}>{totalCal} cal · {food.reduce((s, f) => s + f.protein, 0)}g protein</span>
          </div>
        )}
      </div>

      {/* Add form */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Add Meal</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Meal name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={inputStyle}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="number"
              placeholder="Calories"
              value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
              style={inputStyle}
              required
            />
            <input
              type="number"
              placeholder="Protein (g)"
              value={form.protein}
              onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={form.saveToBank}
              onChange={e => setForm(f => ({ ...f, saveToBank: e.target.checked }))}
            />
            Save to meal bank
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#FF6B35', color: 'white', border: 'none',
              borderRadius: 10, padding: '12px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Barlow Condensed',
            }}
          >
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
