import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { getMondayOfWeek } from '../utils';
import { api } from '../api';

const card = { background: '#1E2328', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid #2A2F38' };
const input = { background: '#252A31', border: '1px solid #3A4048', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 14, fontFamily: 'Archivo', width: '100%' };

const ACTIVITIES = ['Golf', 'Basketball', 'Paddle Tennis', 'Cardio', 'Other'];

export default function Sport() {
  const { activeDate } = useApp();
  const weekStart = getMondayOfWeek(activeDate);

  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({ sessions: 0, totalMinutes: 0, holesWalked: 0, holesCart: 0 });
  const [activity, setActivity] = useState('Golf');
  const [minutes, setMinutes] = useState('');
  const [holesWalked, setHolesWalked] = useState('');
  const [holesCart, setHolesCart] = useState('');

  const load = () => {
    api.getSport().then(setSessions).catch(() => {});
    api.getSportWeeklySummary(weekStart).then(setSummary).catch(() => {});
  };

  useEffect(() => { load(); }, [activeDate]);

  const handleLog = async () => {
    if (!minutes) return;
    await api.addSport({
      activity, minutes: parseInt(minutes),
      holes_walked: parseInt(holesWalked) || 0,
      holes_cart: parseInt(holesCart) || 0,
      date: activeDate
    });
    setMinutes('');
    setHolesWalked('');
    setHolesCart('');
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteSport(id);
    load();
  };

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Activity selector */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>ACTIVITY</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {ACTIVITIES.map(a => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              style={{
                background: activity === a ? '#FF6B35' : '#252A31',
                border: `1px solid ${activity === a ? '#FF6B35' : '#3A4048'}`,
                color: '#fff', borderRadius: 20, padding: '6px 14px',
                fontFamily: 'Archivo', fontSize: 13, cursor: 'pointer'
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Golf-specific fields */}
        {activity === 'Golf' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Holes Walked</div>
              <input type="number" style={input} placeholder="0" value={holesWalked} onChange={e => setHolesWalked(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Holes (Cart)</div>
              <input type="number" style={input} placeholder="0" value={holesCart} onChange={e => setHolesCart(e.target.value)} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Minutes</div>
          <input type="number" style={input} placeholder="60" value={minutes} onChange={e => setMinutes(e.target.value)} />
        </div>
        <button
          onClick={handleLog}
          style={{ width: '100%', background: '#FF6B35', border: 'none', color: '#fff', borderRadius: 8, padding: '11px', fontFamily: 'Barlow Condensed', fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
        >
          Log Session
        </button>
      </div>

      {/* Weekly summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Sessions', value: `${summary.sessions}/4`, ok: summary.sessions >= 4 },
          { label: 'Minutes', value: summary.totalMinutes, ok: false },
          { label: 'Holes Walked', value: summary.holesWalked, ok: false },
          { label: 'Holes (Cart)', value: summary.holesCart, ok: false },
        ].map(tile => (
          <div key={tile.label} style={{ background: '#1E2328', borderRadius: 12, padding: '12px 14px', border: '1px solid #2A2F38' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{tile.label.toUpperCase()}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: tile.ok ? '#5FBF7E' : '#fff' }}>{tile.value}</div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>RECENT SESSIONS</div>
        {sessions.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: 13 }}>No sessions logged</div>
        ) : (
          sessions.slice(0, 10).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2A2F38' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: 16 }}>{s.activity}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {s.date} · {s.minutes} min
                  {s.activity === 'Golf' && s.holes_walked > 0 ? ` · ${s.holes_walked}w` : ''}
                  {s.activity === 'Golf' && s.holes_cart > 0 ? ` · ${s.holes_cart}c` : ''}
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
