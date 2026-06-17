import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

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

export default function Dashboard() {
  const { activeDate, settings } = useApp()
  const [consistency, setConsistency] = useState({ lifts: 0, sport: 0, neck: 0, core: 0, abs: 0, stretch: 0 })
  const [weighIns, setWeighIns] = useState([])
  const [keyLifts, setKeyLifts] = useState({ deadlift: [], bench: [], pullups: [] })
  const [weekCalories, setWeekCalories] = useState([])

  const cardStyle = {
    background: '#1E2328', borderRadius: 12, padding: 16, marginBottom: 16,
  }
  const sectionTitle = {
    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
    color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  }

  const fetchData = useCallback(async () => {
    const weekDates = getWeekDates(activeDate)

    // Lifts: count distinct days with entries
    let liftDays = 0
    for (const d of weekDates) {
      const res = await fetch(`/api/lifts?date=${d}`)
      const data = await res.json()
      if (data.length > 0) liftDays++
    }

    // Sport
    const sportRes = await fetch('/api/sport/weekly-summary')
    const sportData = await sportRes.json()

    // Checklist
    const checkCounts = { neck: 0, core: 0, abs: 0, stretch: 0 }
    for (const d of weekDates) {
      const res = await fetch(`/api/checklist?date=${d}`)
      const data = await res.json()
      for (const row of data) {
        if (checkCounts[row.item] !== undefined) checkCounts[row.item]++
      }
    }

    setConsistency({ lifts: liftDays, sport: sportData.sessions, ...checkCounts })

    // Weigh-ins
    const wRes = await fetch('/api/weigh-ins')
    setWeighIns(await wRes.json())

    // Key lifts progression
    const [dlRes, bpRes, puRes] = await Promise.all([
      fetch('/api/lifts/progression/Deadlift'),
      fetch('/api/lifts/progression/Bench Press'),
      fetch('/api/lifts/progression/Pull-ups'),
    ])
    setKeyLifts({
      deadlift: await dlRes.json(),
      bench: await bpRes.json(),
      pullups: await puRes.json(),
    })

    // Weekly calories
    const calData = []
    for (let i = 0; i < 7; i++) {
      const d = weekDates[i]
      const res = await fetch(`/api/food?date=${d}`)
      const food = await res.json()
      calData.push({ day: DAY_LABELS[i], date: d, calories: food.reduce((s, f) => s + f.calories, 0) })
    }
    setWeekCalories(calData)
  }, [activeDate])

  useEffect(() => { fetchData() }, [fetchData])

  const TILES = [
    { key: 'lifts', label: 'Lifts', target: 3, suffix: 'x' },
    { key: 'sport', label: 'Sport+Cardio', target: 4, suffix: 'x' },
    { key: 'neck', label: 'Neck', target: 4, suffix: 'x' },
    { key: 'core', label: 'Core', target: 2, suffix: 'x' },
    { key: 'abs', label: 'Abs', target: 2, suffix: 'x' },
    { key: 'stretch', label: 'Stretch', target: 4, suffix: 'x' },
  ]

  const last14 = weighIns.slice(-14)
  const latestW = weighIns.length > 0 ? weighIns[weighIns.length - 1] : null
  const latestWaist = weighIns.filter(w => w.waist).slice(-1)[0] || null
  const deltaWeight = latestW ? (latestW.weight - settings.start_weight).toFixed(1) : null
  const firstWaist = weighIns.find(w => w.waist)?.waist
  const deltaWaist = latestWaist && firstWaist ? (latestWaist.waist - firstWaist).toFixed(1) : null

  return (
    <div>
      {/* Consistency */}
      <div style={cardStyle}>
        <div style={sectionTitle}>This Week</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TILES.map(tile => {
            const count = consistency[tile.key] || 0
            const ok = count >= tile.target
            return (
              <div key={tile.key} style={{
                background: '#14171C', borderRadius: 10, padding: '12px 14px',
                borderLeft: `3px solid ${ok ? '#5FBF7E' : '#FF6B35'}`,
              }}>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{tile.label} {tile.target}{tile.suffix}</div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28,
                  fontWeight: 700, color: ok ? '#5FBF7E' : '#FF6B35',
                }}>
                  {count}/{tile.target}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weight & Waist */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Body Metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Weight */}
          <div style={{ background: '#14171C', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Weight</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700 }}>
              {latestW ? `${latestW.weight}` : '—'}
            </div>
            {deltaWeight && (
              <div style={{ fontSize: 12, color: parseFloat(deltaWeight) < 0 ? '#5FBF7E' : '#EF4444' }}>
                {parseFloat(deltaWeight) > 0 ? '+' : ''}{deltaWeight} lbs
              </div>
            )}
            {last14.length > 0 && (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={last14}>
                  <Line type="monotone" dataKey="weight" stroke="#FF6B35" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Waist */}
          <div style={{ background: '#14171C', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Waist</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700 }}>
              {latestWaist ? `${latestWaist.waist}"` : '—'}
            </div>
            {deltaWaist && (
              <div style={{ fontSize: 12, color: parseFloat(deltaWaist) < 0 ? '#5FBF7E' : '#EF4444' }}>
                {parseFloat(deltaWaist) > 0 ? '+' : ''}{deltaWaist}"
              </div>
            )}
            {weighIns.filter(w => w.waist).length > 0 && (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={weighIns.filter(w => w.waist).slice(-14)}>
                  <Line type="monotone" dataKey="waist" stroke="#5FBF7E" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Key Lifts */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Key Lifts</div>
        {[
          { name: 'Deadlift', data: keyLifts.deadlift },
          { name: 'Bench Press', data: keyLifts.bench },
          { name: 'Pull-ups', data: keyLifts.pullups },
        ].map(lift => (
          <div key={lift.name} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{lift.name}</div>
            {lift.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={lift.data}>
                  <Line type="monotone" dataKey="maxWeight" stroke="#FF6B35" dot={false} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#FF6B35' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#9CA3AF', fontSize: 13 }}>No data yet</div>
            )}
          </div>
        ))}
      </div>

      {/* Weekly Calories */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Weekly Calories</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekCalories} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} width={40} />
            <Tooltip
              contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#FF6B35' }}
            />
            <ReferenceLine y={settings.weekday_target} stroke="#FF6B35" strokeDasharray="4 2" />
            <Bar dataKey="calories" fill="#FF6B35" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
