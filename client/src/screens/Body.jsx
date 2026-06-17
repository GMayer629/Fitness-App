import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { useApp } from '../AppContext';
import { api } from '../api';

const card = { background: '#1E2328', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid #2A2F38' };
const input = { background: '#252A31', border: '1px solid #3A4048', borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 14, fontFamily: 'Archivo', width: '100%' };
const labelStyle = { fontSize: 11, color: '#9CA3AF', marginBottom: 4 };

function BarbellMeter({ current, start, goal }) {
  const pct = Math.max(0, Math.min(100, ((start - current) / (start - goal)) * 100));
  const lbsLost = start - current;
  const lbsToGo = current - goal;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
        <span>Start: {start} lbs</span>
        <span>Goal: {goal} lbs</span>
      </div>
      <div style={{ position: 'relative', height: 24, background: '#2A2F38', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #5FBF7E, #FF6B35)', width: `${pct}%`, borderRadius: 12, transition: 'width 0.5s' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed', fontSize: 14 }}>
          {pct.toFixed(1)}% — {lbsLost.toFixed(1)} lbs lost · {lbsToGo.toFixed(1)} to go
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
        <span>Current: {current} lbs</span>
      </div>
    </div>
  );
}

function computePace(weighIns) {
  if (weighIns.length < 2) return null;
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.filter(w => {
    const d = new Date(w.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 21);
    return d >= cutoff;
  });
  if (recent.length < 2) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const days = (new Date(last.date) - new Date(first.date)) / 86400000;
  if (days === 0) return null;
  const lbsPerDay = (last.weight - first.weight) / days;
  const lbsPerWeek = lbsPerDay * 7;
  return lbsPerWeek;
}

function computeGoalDate(currentWeight, goalWeight, lbsPerWeek) {
  if (!lbsPerWeek || lbsPerWeek >= 0) return null;
  const weeksNeeded = (currentWeight - goalWeight) / Math.abs(lbsPerWeek);
  const d = new Date();
  d.setDate(d.getDate() + Math.round(weeksNeeded * 7));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Body() {
  const { activeDate, settings, refreshSettings } = useApp();
  const [weighIns, setWeighIns] = useState([]);
  const [form, setForm] = useState({ weight: '', waist: '' });
  const [settingsForm, setSettingsForm] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const load = () => {
    api.getWeighIns(200).then(d => setWeighIns([...d].reverse())).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleLog = async () => {
    if (!form.weight) return;
    await api.addWeighIn({ date: activeDate, weight: parseFloat(form.weight), waist: parseFloat(form.waist) || null });
    setForm({ weight: '', waist: '' });
    load();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await api.updateSettings({
      weekday_target: parseInt(settingsForm.weekday_target),
      friday_target: parseInt(settingsForm.friday_target),
      weekend_target: parseInt(settingsForm.weekend_target),
      protein_target: parseInt(settingsForm.protein_target),
      start_weight: parseFloat(settingsForm.start_weight),
      goal_weight: parseFloat(settingsForm.goal_weight),
      goal_waist: parseFloat(settingsForm.goal_waist),
      goal_date: settingsForm.goal_date,
    });
    await refreshSettings();
    setSavingSettings(false);
  };

  const lbsPerWeek = computePace(weighIns);
  const latestWeight = weighIns.length ? weighIns[weighIns.length - 1].weight : settings.start_weight;
  const estimatedGoalDate = lbsPerWeek ? computeGoalDate(latestWeight, settings.goal_weight, lbsPerWeek) : null;

  // Build chart data: actual weigh-ins + goal line
  const chartData = weighIns.map(w => ({ date: w.date, weight: w.weight }));

  // Add goal point
  const goalPoint = { date: settings.goal_date, goal: settings.goal_weight };

  // Build combined data for chart
  const allDates = new Set([...chartData.map(d => d.date), settings.goal_date]);
  const combinedData = [...allDates].sort().map(date => {
    const actual = chartData.find(d => d.date === date);
    return { date, weight: actual?.weight, goal: date === settings.goal_date ? settings.goal_weight : undefined };
  });

  // Add start point for goal line
  if (chartData.length > 0) {
    const firstDate = chartData[0].date;
    combinedData.unshift({ date: firstDate, goal: settings.start_weight });
  }

  const waistData = weighIns.filter(w => w.waist).map(w => ({ date: w.date, waist: w.waist }));

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Weight chart */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>WEIGHT TREND</div>
        {lbsPerWeek && (
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>
            {lbsPerWeek < 0 ? (
              <span>Losing <span style={{ color: '#5FBF7E' }}>{Math.abs(lbsPerWeek).toFixed(2)} lbs/wk</span>{estimatedGoalDate ? ` · on pace for ${estimatedGoalDate}` : ''}</span>
            ) : (
              <span style={{ color: '#FF6B35' }}>+{lbsPerWeek.toFixed(2)} lbs/wk (21-day avg)</span>
            )}
          </div>
        )}
        {combinedData.length > 1 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={combinedData}>
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#1E2328', border: 'none', fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#FF6B35" strokeWidth={2} dot={false} name="Weight" connectNulls={false} />
              <Line type="monotone" dataKey="goal" stroke="#5FBF7E" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Goal" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#6B7280', fontSize: 13, height: 100, display: 'flex', alignItems: 'center' }}>Log weigh-ins to see trend</div>
        )}
      </div>

      {/* Barbell goal meter */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>GOAL PROGRESS</div>
        <BarbellMeter current={latestWeight} start={settings.start_weight} goal={settings.goal_weight} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
          Goal: {settings.goal_weight} lbs by {settings.goal_date}
        </div>
      </div>

      {/* Waist chart */}
      {waistData.length > 1 && (
        <div style={card}>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>WAIST TREND</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={waistData}>
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#9CA3AF', fontSize: 10 }} width={36} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1E2328', border: 'none', fontSize: 12 }} />
              <Line type="monotone" dataKey="waist" stroke="#5FBF7E" strokeWidth={2} dot={false} name="Waist (in)" />
              <ReferenceLine y={settings.goal_waist} stroke="#5FBF7E44" strokeDasharray="4 4" label={{ value: `goal ${settings.goal_waist}"`, fill: '#5FBF7E', fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log weigh-in */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>LOG WEIGH-IN</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={labelStyle}>Weight (lbs)</div>
            <input type="number" step="0.1" style={input} placeholder="170.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <div style={labelStyle}>Waist (in)</div>
            <input type="number" step="0.25" style={input} placeholder="32.5" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} />
          </div>
        </div>
        <button
          onClick={handleLog}
          style={{ width: '100%', background: '#FF6B35', border: 'none', color: '#fff', borderRadius: 8, padding: '11px', fontFamily: 'Barlow Condensed', fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
        >
          Log Weigh-In
        </button>
      </div>

      {/* Settings */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>SETTINGS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { key: 'weekday_target', label: 'Weekday Cal' },
            { key: 'friday_target', label: 'Friday Cal' },
            { key: 'weekend_target', label: 'Weekend Cal' },
            { key: 'protein_target', label: 'Protein Goal (g)' },
            { key: 'start_weight', label: 'Start Weight' },
            { key: 'goal_weight', label: 'Goal Weight' },
            { key: 'goal_waist', label: 'Goal Waist (in)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div style={labelStyle}>{label}</div>
              <input
                type="number"
                step={key.includes('waist') ? '0.25' : '1'}
                style={input}
                value={settingsForm[key] ?? ''}
                onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <div style={labelStyle}>Goal Date</div>
            <input
              type="date"
              style={input}
              value={settingsForm.goal_date ?? ''}
              onChange={e => setSettingsForm(f => ({ ...f, goal_date: e.target.value }))}
            />
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          style={{ width: '100%', background: '#5FBF7E', border: 'none', color: '#fff', borderRadius: 8, padding: '11px', fontFamily: 'Barlow Condensed', fontSize: 16, cursor: 'pointer', fontWeight: 600, opacity: savingSettings ? 0.7 : 1 }}
        >
          {savingSettings ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Weigh-in history */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 }}>HISTORY</div>
        {[...weighIns].reverse().slice(0, 20).map(w => (
          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2A2F38', fontSize: 14 }}>
            <span style={{ color: '#9CA3AF' }}>{w.date}</span>
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16 }}>{w.weight} lbs{w.waist ? ` · ${w.waist}"` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
