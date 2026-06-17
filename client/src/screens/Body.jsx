import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

export default function Body() {
  const { activeDate, settings, refreshSettings } = useApp()
  const [weighIns, setWeighIns] = useState([])
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [localSettings, setLocalSettings] = useState(null)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (settings) setLocalSettings({ ...settings })
  }, [settings])

  const fetchWeighIns = useCallback(async () => {
    const res = await fetch('/api/weigh-ins')
    setWeighIns(await res.json())
  }, [])

  useEffect(() => { fetchWeighIns() }, [fetchWeighIns])

  const handleLogWeighIn = async () => {
    if (!weight) return
    await fetch('/api/weigh-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: activeDate, weight: parseFloat(weight), waist: waist ? parseFloat(waist) : null }),
    })
    setWeight('')
    setWaist('')
    fetchWeighIns()
  }

  const handleSaveSettings = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localSettings),
    })
    refreshSettings()
    setSaveMsg('Saved!')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  // Compute pace
  const computePace = () => {
    if (weighIns.length < 2) return null
    const now = new Date()
    const cutoff = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
    const recent = weighIns.filter(w => new Date(w.date) >= cutoff)
    if (recent.length < 2) return null
    const first = recent[0]
    const last = recent[recent.length - 1]
    const days = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)
    if (days === 0) return null
    const lbsPerWeek = ((last.weight - first.weight) / days) * 7
    return { lbsPerWeek: lbsPerWeek.toFixed(2), currentWeight: last.weight }
  }

  const computeGoalDate = (pace, currentWeight) => {
    if (!pace || parseFloat(pace) >= 0) return null
    const lbsPerDay = parseFloat(pace) / 7
    const daysToGoal = (currentWeight - settings.goal_weight) / Math.abs(lbsPerDay)
    const goalDate = new Date()
    goalDate.setDate(goalDate.getDate() + Math.round(daysToGoal))
    return goalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const paceData = computePace()

  // Progress bar calculation
  const latestWeight = weighIns.length > 0 ? weighIns[weighIns.length - 1].weight : settings.start_weight
  const progressPct = Math.max(0, Math.min(100,
    ((settings.start_weight - latestWeight) / (settings.start_weight - settings.goal_weight)) * 100
  ))

  const weightChartData = weighIns.map(w => ({ date: w.date.slice(5), actual: w.weight }))
  const waistData = weighIns.filter(w => w.waist).map(w => ({ date: w.date.slice(5), waist: w.waist }))

  const cardStyle = { background: '#1E2328', borderRadius: 12, padding: 16, marginBottom: 16 }
  const sectionTitle = {
    fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 700,
    color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  }
  const inputStyle = {
    background: '#14171C', border: '1px solid #3D4149', color: 'white',
    borderRadius: 8, padding: '10px 12px', fontSize: 15,
    fontFamily: 'Archivo, sans-serif', width: '100%',
  }

  return (
    <div>
      {/* Weight trend */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Weight Trend</div>
        {weightChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightChartData}>
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} width={40} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#FF6B35' }} />
              <ReferenceLine y={settings.goal_weight} stroke="#5FBF7E" strokeDasharray="6 3" label={{ value: `Goal ${settings.goal_weight}`, fill: '#5FBF7E', fontSize: 11 }} />
              <Line type="monotone" dataKey="actual" stroke="#FF6B35" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>No weigh-ins yet</p>
        )}
      </div>

      {/* Pace */}
      {paceData && (
        <div style={cardStyle}>
          <div style={sectionTitle}>Pace</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 700, color: parseFloat(paceData.lbsPerWeek) < 0 ? '#5FBF7E' : '#EF4444' }}>
            {parseFloat(paceData.lbsPerWeek) > 0 ? '+' : ''}{paceData.lbsPerWeek} lbs/week
          </div>
          {computeGoalDate(paceData.lbsPerWeek, paceData.currentWeight) && (
            <div style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
              On pace to reach goal by {computeGoalDate(paceData.lbsPerWeek, paceData.currentWeight)}
            </div>
          )}
        </div>
      )}

      {/* Waist trend */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Waist Trend</div>
        {waistData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={waistData}>
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} width={40} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#5FBF7E' }} />
              {settings.goal_waist && <ReferenceLine y={settings.goal_waist} stroke="#5FBF7E" strokeDasharray="6 3" />}
              <Line type="monotone" dataKey="waist" stroke="#5FBF7E" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>No waist measurements yet</p>
        )}
      </div>

      {/* Log weigh-in */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Log Weigh-In</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Weight (lbs)</label>
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} placeholder="170.5" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Waist (in, optional)</label>
            <input type="number" step="0.25" value={waist} onChange={e => setWaist(e.target.value)} style={inputStyle} placeholder="32.5" />
          </div>
        </div>
        <button
          onClick={handleLogWeighIn}
          style={{
            width: '100%', background: '#FF6B35', color: 'white', border: 'none',
            borderRadius: 10, padding: '12px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Barlow Condensed',
          }}
        >
          Log Weigh-In
        </button>
      </div>

      {/* Progress bar */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Goal Progress</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#9CA3AF' }}>
          <span>{settings.start_weight} lbs (start)</span>
          <span>{settings.goal_weight} lbs (goal)</span>
        </div>
        <div style={{ background: '#3D4149', borderRadius: 6, height: 14 }}>
          <div style={{
            height: 14, borderRadius: 6, background: '#5FBF7E',
            width: `${progressPct}%`, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 14, color: '#5FBF7E', fontFamily: 'Barlow Condensed', fontWeight: 700 }}>
          {progressPct.toFixed(1)}% to goal
        </div>
      </div>

      {/* Settings */}
      {localSettings && (
        <div style={cardStyle}>
          <div style={sectionTitle}>Settings</div>
          {[
            { key: 'weekday_target', label: 'Weekday Cal Target', type: 'number' },
            { key: 'friday_target', label: 'Friday Cal Target', type: 'number' },
            { key: 'weekend_target', label: 'Weekend Cal Target', type: 'number' },
            { key: 'protein_target', label: 'Protein Target (g)', type: 'number' },
            { key: 'start_weight', label: 'Start Weight (lbs)', type: 'number' },
            { key: 'goal_weight', label: 'Goal Weight (lbs)', type: 'number' },
            { key: 'goal_waist', label: 'Goal Waist (in)', type: 'number' },
            { key: 'goal_date', label: 'Goal Date', type: 'date' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>{field.label}</label>
              <input
                type={field.type}
                step={field.type === 'number' ? '0.5' : undefined}
                value={localSettings[field.key] || ''}
                onChange={e => setLocalSettings(s => ({ ...s, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
          {saveMsg && <p style={{ color: '#5FBF7E', fontSize: 14, marginBottom: 8 }}>{saveMsg}</p>}
          <button
            onClick={handleSaveSettings}
            style={{
              width: '100%', background: '#FF6B35', color: 'white', border: 'none',
              borderRadius: 10, padding: '12px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Barlow Condensed',
            }}
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  )
}
