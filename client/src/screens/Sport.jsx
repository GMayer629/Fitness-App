import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

const ACTIVITIES = ['Golf', 'Basketball', 'Paddle Tennis', 'Cardio', 'Other']

export default function Sport() {
  const { activeDate } = useApp()
  const [activity, setActivity] = useState('Golf')
  const [minutes, setMinutes] = useState('')
  const [holesWalked, setHolesWalked] = useState('')
  const [holesCart, setHolesCart] = useState('')
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState({ sessions: 0, totalMinutes: 0, holesWalked: 0, holesCart: 0 })

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`/api/sport?date=${activeDate}`)
    setSessions(await res.json())
  }, [activeDate])

  const fetchSummary = async () => {
    const res = await fetch('/api/sport/weekly-summary')
    setSummary(await res.json())
  }

  useEffect(() => {
    fetchSessions()
    fetchSummary()
  }, [fetchSessions])

  const handleLog = async () => {
    if (!minutes) return
    await fetch('/api/sport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity, minutes: parseInt(minutes),
        holes_walked: parseInt(holesWalked) || 0,
        holes_cart: parseInt(holesCart) || 0,
        date: activeDate,
      }),
    })
    setMinutes('')
    setHolesWalked('')
    setHolesCart('')
    fetchSessions()
    fetchSummary()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/sport/${id}`, { method: 'DELETE' })
    fetchSessions()
    fetchSummary()
  }

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
      {/* Activity selector */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Activity</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ACTIVITIES.map(a => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              style={{
                background: activity === a ? 'transparent' : '#3D4149',
                color: activity === a ? '#FF6B35' : 'white',
                border: activity === a ? '2px solid #FF6B35' : '2px solid transparent',
                borderRadius: 8, padding: '8px 14px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {activity === 'Golf' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Holes Walked</label>
              <input type="number" value={holesWalked} onChange={e => setHolesWalked(e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Holes (Cart)</label>
              <input type="number" value={holesCart} onChange={e => setHolesCart(e.target.value)} style={inputStyle} placeholder="0" />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Minutes</label>
          <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} style={inputStyle} placeholder="60" />
        </div>

        <button
          onClick={handleLog}
          style={{
            width: '100%', background: '#FF6B35', color: 'white', border: 'none',
            borderRadius: 10, padding: '12px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Barlow Condensed',
          }}
        >
          Log Session
        </button>
      </div>

      {/* Weekly summary */}
      <div style={cardStyle}>
        <div style={sectionTitle}>This Week</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Sessions', value: `${summary.sessions}/4`, color: summary.sessions >= 4 ? '#5FBF7E' : '#FF6B35' },
            { label: 'Total Minutes', value: summary.totalMinutes, color: 'white' },
            { label: 'Holes Walked', value: summary.holesWalked, color: 'white' },
            { label: 'Holes (Cart)', value: summary.holesCart, color: 'white' },
          ].map(tile => (
            <div key={tile.label} style={{ background: '#14171C', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{tile.label}</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: tile.color }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Today's Sessions</div>
        {sessions.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>No sessions logged today</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid #2D3139',
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{session.activity}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {session.minutes} min
                  {session.activity === 'Golf' && (session.holes_walked > 0 || session.holes_cart > 0) && (
                    <> · {session.holes_walked > 0 ? `${session.holes_walked} walked` : ''}{session.holes_walked > 0 && session.holes_cart > 0 ? ', ' : ''}{session.holes_cart > 0 ? `${session.holes_cart} cart` : ''}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(session.id)}
                style={{ background: 'none', color: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 18 }}
              >×</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
