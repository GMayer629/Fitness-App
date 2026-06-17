import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TEMPLATES = [
  { id: 'upper', name: 'Upper', exercises: ['Bench Press', 'Overhead Press', 'Barbell Row', 'Pull-ups'] },
  { id: 'legs', name: 'Legs', exercises: ['Squat', 'Romanian Deadlift', 'Deadlift', 'Leg Press'] },
  { id: 'arms', name: 'Arms (current)', exercises: ['Bicep Curl', 'Tricep Pushdown', 'Hammer Curl', 'Skull Crushers'] },
  { id: 'arms_athletic', name: 'Arms+Athletic (recommended)', exercises: ['Bicep Curl', 'Tricep Pushdown', 'Lateral Raise', 'Face Pull'] },
  { id: 'home', name: 'Home DB', exercises: ['DB Press', 'DB Row', 'DB Shoulder Press', 'DB Curl'] },
]

export default function Train() {
  const { activeDate } = useApp()
  const [expandedTemplate, setExpandedTemplate] = useState(null)
  const [liftsToday, setLiftsToday] = useState({})
  const [lastSession, setLastSession] = useState({})
  const [progression, setProgression] = useState({})
  const [inputs, setInputs] = useState({}) // { exercise: { weight, reps } }

  const fetchTemplateData = useCallback(async (templateId) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    // Today's lifts
    const res = await fetch(`/api/lifts?date=${activeDate}`)
    const allLifts = await res.json()
    const byExercise = {}
    for (const ex of template.exercises) {
      byExercise[ex] = allLifts.filter(l => l.exercise === ex)
    }
    setLiftsToday(byExercise)

    // Last session and progression for each exercise
    const lastSessions = {}
    const progressions = {}
    await Promise.all(template.exercises.map(async ex => {
      const [lsRes, pgRes] = await Promise.all([
        fetch(`/api/lifts/last-session/${encodeURIComponent(ex)}`),
        fetch(`/api/lifts/progression/${encodeURIComponent(ex)}`),
      ])
      lastSessions[ex] = await lsRes.json()
      progressions[ex] = await pgRes.json()
    }))
    setLastSession(lastSessions)
    setProgression(progressions)
  }, [activeDate])

  const handleExpand = (templateId) => {
    if (expandedTemplate === templateId) {
      setExpandedTemplate(null)
    } else {
      setExpandedTemplate(templateId)
      fetchTemplateData(templateId)
    }
  }

  const handleAddSet = async (exercise) => {
    const inp = inputs[exercise] || {}
    if (!inp.weight || !inp.reps) return
    await fetch('/api/lifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise, weight: parseFloat(inp.weight), reps: parseInt(inp.reps), date: activeDate }),
    })
    setInputs(i => ({ ...i, [exercise]: { weight: inp.weight, reps: '' } }))
    fetchTemplateData(expandedTemplate)
  }

  const handleDeleteSet = async (id) => {
    await fetch(`/api/lifts/${id}`, { method: 'DELETE' })
    fetchTemplateData(expandedTemplate)
  }

  const cardStyle = { background: '#1E2328', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }
  const inputStyle = {
    background: '#14171C', border: '1px solid #3D4149', color: 'white',
    borderRadius: 8, padding: '10px 12px', fontSize: 15,
    fontFamily: 'Archivo, sans-serif', width: '100%',
  }

  return (
    <div>
      <div style={{
        fontFamily: 'Barlow Condensed', fontSize: 13, fontWeight: 700,
        color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
      }}>
        Workout Templates
      </div>

      {TEMPLATES.map(template => {
        const isExpanded = expandedTemplate === template.id
        return (
          <div key={template.id} style={cardStyle}>
            {/* Template header */}
            <button
              onClick={() => handleExpand(template.id)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none', color: 'white', padding: '16px',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700 }}>
                {template.name}
              </span>
              <span style={{ color: '#9CA3AF', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                {template.exercises.map(exercise => {
                  const todaySets = liftsToday[exercise] || []
                  const ls = lastSession[exercise]
                  const prog = progression[exercise] || []
                  const inp = inputs[exercise] || { weight: '', reps: '' }

                  return (
                    <div key={exercise} style={{
                      background: '#14171C', borderRadius: 10, padding: 12, marginBottom: 12,
                    }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                        {exercise}
                      </div>

                      {/* Last session */}
                      {ls && ls.sets && ls.sets.length > 0 ? (
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                          Last ({ls.date}): {ls.sets.map(s => `${s.weight}x${s.reps}`).join(', ')}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>No previous session</div>
                      )}

                      {/* Today's sets */}
                      {todaySets.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {todaySets.map(set => (
                            <div key={set.id} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: '#2D3139', borderRadius: 6, padding: '4px 8px',
                            }}>
                              <span style={{ fontSize: 13 }}>{set.weight}x{set.reps}</span>
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add set */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          type="number"
                          placeholder="Weight"
                          value={inp.weight}
                          onChange={e => setInputs(i => ({ ...i, [exercise]: { ...inp, weight: e.target.value } }))}
                          style={{ ...inputStyle, width: '50%' }}
                        />
                        <input
                          type="number"
                          placeholder="Reps"
                          value={inp.reps}
                          onChange={e => setInputs(i => ({ ...i, [exercise]: { ...inp, reps: e.target.value } }))}
                          style={{ ...inputStyle, width: '30%' }}
                        />
                        <button
                          onClick={() => handleAddSet(exercise)}
                          style={{
                            background: '#FF6B35', color: 'white', border: 'none',
                            borderRadius: 8, padding: '8px 12px', fontSize: 13,
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed',
                            flex: 1,
                          }}
                        >
                          Add
                        </button>
                      </div>

                      {/* Progression chart */}
                      {prog.length > 1 && (
                        <ResponsiveContainer width="100%" height={60}>
                          <LineChart data={prog}>
                            <Line type="monotone" dataKey="maxWeight" stroke="#FF6B35" dot={false} strokeWidth={2} />
                            <Tooltip
                              contentStyle={{ background: '#1E2328', border: 'none', borderRadius: 8 }}
                              itemStyle={{ color: '#FF6B35' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
