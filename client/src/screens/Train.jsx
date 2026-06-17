import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../AppContext';
import { api } from '../api';

const TEMPLATES = [
  { name: 'Upper', exercises: ['Bench Press', 'Overhead Press', 'Barbell Row', 'Pull-ups'] },
  { name: 'Legs', exercises: ['Squat', 'Romanian Deadlift', 'Deadlift', 'Leg Press'] },
  { name: 'Arms (Current)', exercises: ['Bicep Curl', 'Tricep Pushdown', 'Hammer Curl', 'Skull Crushers'] },
  { name: 'Arms+Athletic ★', exercises: ['Bicep Curl', 'Tricep Pushdown', 'Lateral Raise', 'Face Pull'] },
  { name: 'Home DB', exercises: ['DB Press', 'DB Row', 'DB Shoulder Press', 'DB Curl'] },
];

const card = { background: '#1E2328', borderRadius: 12, marginBottom: 10, border: '1px solid #2A2F38', overflow: 'hidden' };

function ExerciseRow({ exercise, activeDate, allLifts, onAdd, onDelete }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [lastSession, setLastSession] = useState(null);
  const [progression, setProgression] = useState([]);

  useEffect(() => {
    api.getLastSession(exercise).then(setLastSession).catch(() => {});
    api.getProgression(exercise).then(setProgression).catch(() => {});
  }, [exercise, allLifts]);

  const todaySets = allLifts.filter(l => l.exercise === exercise);

  const handleAdd = async () => {
    if (!weight || !reps) return;
    await onAdd({ exercise, weight: parseFloat(weight), reps: parseInt(reps), date: activeDate });
    setWeight('');
    setReps('');
  };

  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid #2A2F38' }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{exercise}</div>

      {/* Last session */}
      {lastSession?.date && (
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
          Last: {lastSession.date} — {lastSession.sets.map(s => `${s.weight}×${s.reps}`).join(', ')}
        </div>
      )}

      {/* Today's sets chips */}
      {todaySets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {todaySets.map(s => (
            <div key={s.id} style={{ background: '#2A2F38', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ fontFamily: 'Barlow Condensed', color: '#FF6B35' }}>{s.weight}×{s.reps}</span>
              <button onClick={() => onDelete(s.id)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add set */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          type="number"
          placeholder="lbs"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          style={{ background: '#252A31', border: '1px solid #3A4048', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 14, width: 80 }}
        />
        <input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={e => setReps(e.target.value)}
          style={{ background: '#252A31', border: '1px solid #3A4048', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 14, width: 80 }}
        />
        <button
          onClick={handleAdd}
          style={{ background: '#FF6B35', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 14px', fontFamily: 'Barlow Condensed', fontSize: 15, cursor: 'pointer', fontWeight: 600 }}
        >
          + Set
        </button>
      </div>

      {/* Mini progression chart */}
      {progression.length > 1 && (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={progression}>
            <Line type="monotone" dataKey="topWeight" stroke="#FF6B35" strokeWidth={2} dot={false} />
            <Tooltip contentStyle={{ background: '#1E2328', border: 'none', fontSize: 11 }} formatter={v => [`${v} lbs`]} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function Train() {
  const { activeDate } = useApp();
  const [expanded, setExpanded] = useState(null);
  const [lifts, setLifts] = useState([]);

  const load = () => api.getLifts(activeDate).then(setLifts).catch(() => {});
  useEffect(() => { load(); }, [activeDate]);

  const handleAdd = async (entry) => {
    await api.addLift(entry);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteLift(id);
    load();
  };

  return (
    <div style={{ padding: '16px 12px' }}>
      {TEMPLATES.map(template => (
        <div key={template.name} style={card}>
          <button
            onClick={() => setExpanded(expanded === template.name ? null : template.name)}
            style={{
              width: '100%', background: 'none', border: 'none', color: '#fff',
              padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: 18, fontWeight: 700 }}>{template.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Count today's lifts in this template */}
              {(() => {
                const count = lifts.filter(l => template.exercises.includes(l.exercise)).length;
                return count > 0 ? <span style={{ background: '#FF6B35', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontFamily: 'Barlow Condensed' }}>{count} sets</span> : null;
              })()}
              <span style={{ color: '#9CA3AF', fontSize: 18 }}>{expanded === template.name ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === template.name && (
            <div>
              {template.exercises.map(ex => (
                <ExerciseRow
                  key={ex}
                  exercise={ex}
                  activeDate={activeDate}
                  allLifts={lifts}
                  onAdd={handleAdd}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
