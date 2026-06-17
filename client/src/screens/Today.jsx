import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import IntervalTimer from '../components/IntervalTimer'

const CHECKLIST_ITEMS = ['neck', 'core', 'abs', 'stretch']
const CHECKLIST_TARGETS = { neck: 4, core: 2, abs: 2, stretch: 4 }

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

export default function Today() {
  const { activeDate, settings } = useApp()
  const [showTimer, setShowTimer] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [food, setFood] = useState([])
  const [todayWeight, setTodayWeight] = useState(null)
  const [weekChecklist, setWeekChecklist] = useState({})
  const [tiffMsg, setTiffMsg] = useState('')

  const fetchChecklist = useCallback(async () => {
    const res = await fetch(`/api/checklist?date=${activeDate}`)
    const data = await res.json()
    setChecklist(data.map(r => r.item))
  }, [activeDate])

  const fetchFood = useCallback(async () => {
    const res = await fetch(`/api/food?date=${activeDate}`)
    setFood(await res.json())
  }, [activeDate])

  const fetchWeekChecklist = useCallback(async () => {
    const weekDates = getWeekDates(activeDate)
    const counts = {}
    for (const item of CHECKLIST_ITEMS) counts[item] = 0
    for (const d of weekDates) {
      const res = await fetch(`/api/checklist?date=${d}`)
      const data = await res.json()
      for (const row of data) {
        if (counts[row.item] !== undefined) counts[row.item]++
      }
    }
    setWeekChecklist(counts)
  }, [activeDate])

  const fetchWeight = useCallback(async () => {
    const res = await fetch('/api/weigh-ins/latest')
    const data = await res.json()
    if (data && data.date === activeDate) setTodayWeight(data.weight)
    else setTodayWeight(null)
  }, [activeDate])

  useEffect(() => {
    fetchChecklist()
    fetchFood()
    fetchWeekChecklist()
    fetchWeight()
  }, [fetchChecklist, fetchFood, fetchWeekChecklist, fetchWeight])

  const toggleItem = async (item) => {
    if (checklist.includes(item)) {
      await fetch(`/api/checklist/${item}/${activeDate}`, { method: 'DELETE' })
    } else {
      await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, date: activeDate }),
      })
    }
    fetchChecklist()
    fetchWeekChecklist()
  }

  const handleTiffxdan = async () => {
    await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: 'abs', date: activeDate }),
    })
    setTiffMsg('Abs logged!')
    fetchChecklist()
    fetchWeekChecklist()
    setTimeout(() => setTiffMsg(''), 2000)
  }

  const handleTimerComplete = async () => {
    await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: 'core', date: activeDate }),
    })
    fetchChecklist()
    fetchWeekChecklist()
  }

  const getDayType = () => {
    const d = new Date(activeDate + 'T00:00:00')
    const dow = d.getDay()
    if (dow === 5) return { label: 'Friday', target: settings.friday_target }
    if (dow === 0 || dow === 6) return { label: 'Weekend', target: settings.weekend_target }
    return { label: 'Weekday', target: settings.weekday_target }
  }

  const { label: dayLabel, target: calTarget } = getDayType()
  const totalCal = food.reduce((s, f) => s + f.calories, 0)
  const totalProtein = food.reduce((s, f) => s + f.protein, 0)
  const calPct = Math.min(100, (totalCal / calTarget) * 100)
  const proteinPct = Math.min(100, (totalProtein / settings.protein_target) * 100)

  const cardStyle = {
    background: '#1E2328',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  }

  const sectionTitle = {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  }

  return (
    <div>
      {showTimer && (
        <IntervalTimer
          onClose={() => setShowTimer(false)}
          onComplete={() => {
            handleTimerComplete()
            setTimeout(() => setShowTimer(false), 2000)
          }}
        />
      )}

      {/* Routines */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Guided Routines</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowTimer(true)}
            style={{
              flex: 1, background: '#FF6B35', color: 'white', border: 'none',
              borderRadius: 10, padding: '12px 8px', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow Condensed',
            }}
          >
            Golf Core 10-min
          </button>
          <button
            onClick={handleTiffxdan}
            style={{
              flex: 1, background: '#3D4149', color: 'white', border: 'none',
              borderRadius: 10, padding: '12px 8px', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow Condensed',
            }}
          >
            Tiffxdan
          </button>
        </div>
        {tiffMsg && <p style={{ color: '#5FBF7E', marginTop: 8, fontSize: 14 }}>{tiffMsg}</p>}
      </div>

      {/* Checklist */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Daily Checklist</div>
        {CHECKLIST_ITEMS.map(item => {
          const done = checklist.includes(item)
          const weekCount = weekChecklist[item] || 0
          const target = CHECKLIST_TARGETS[item]
          return (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid #2D3139',
            }}>
              <div>
                <div style={{ fontWeight: 500, textTransform: 'capitalize', fontSize: 16 }}>{item}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{weekCount}/{target} this week</div>
              </div>
              <button
                onClick={() => toggleItem(item)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: done ? '#5FBF7E' : '#3D4149',
                  border: 'none', cursor: 'pointer', color: 'white',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {done ? '✓' : ''}
              </button>
            </div>
          )
        })}
      </div>

      {/* Calories */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Calories — {dayLabel}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#9CA3AF', fontSize: 14 }}>Target: {calTarget}</span>
          <span style={{ fontSize: 14 }}>Consumed: <strong>{totalCal}</strong></span>
          <span style={{ color: totalCal > calTarget ? '#EF4444' : '#5FBF7E', fontSize: 14 }}>
            {totalCal > calTarget ? `+${totalCal - calTarget} over` : `${calTarget - totalCal} left`}
          </span>
        </div>
        <div style={{ background: '#3D4149', borderRadius: 6, height: 10 }}>
          <div style={{
            height: 10, borderRadius: 6,
            background: totalCal > calTarget ? '#EF4444' : '#FF6B35',
            width: `${calPct}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Protein */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Protein</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#9CA3AF', fontSize: 14 }}>Target: {settings.protein_target}g</span>
          <span style={{ fontSize: 14 }}>Consumed: <strong>{totalProtein}g</strong></span>
        </div>
        <div style={{ background: '#3D4149', borderRadius: 6, height: 10 }}>
          <div style={{
            height: 10, borderRadius: 6,
            background: totalProtein >= settings.protein_target ? '#5FBF7E' : '#FF6B35',
            width: `${proteinPct}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Weight */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Today's Weight</div>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 48,
          fontWeight: 700,
          color: todayWeight ? 'white' : '#9CA3AF',
        }}>
          {todayWeight ? `${todayWeight} lbs` : '—'}
        </div>
      </div>
    </div>
  )
}
