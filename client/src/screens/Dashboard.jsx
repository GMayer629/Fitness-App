import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useApp } from '../AppContext';
import { getMondayOfWeek, getWeekDays, getDayType } from '../utils';
import { api } from '../api';

const card = {
  background: '#1E2328', borderRadius: 12, padding: '14px 16px',
  marginBottom: 12, border: '1px solid #2A2F38',
};

function ConsistencyTile({ label, count, target }) {
  const ok = count >= target;
  return (
    <div style={{
      background: '#252A31', borderRadius: 10, padding: '12px 10px', textAlign: 'center',
      border: `1px solid ${ok ? '#5FBF7E33' : '#FF6B3533'}`,
    }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: ok ? '#5FBF7E' : '#FF6B35' }}>
        {count}/{target}
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Sparkline({ data, dataKey = 'value', color = '#FF6B35' }) {
  if (!data || data.length < 2) return <div style={{ height: 40 }} />;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { activeDate, settings } = useApp();
  const weekStart = getMondayOfWeek(activeDate);

  const [consistency, setConsistency] = useState(null);
  const [weighIns, setWeighIns] = useState([]);
  const [deadliftProg, setDeadliftProg] = useState([]);
  const [benchProg, setBenchProg] = useState([]);
  const [pullupProg, setPullupProg] = useState([]);
  const [weeklyCalories, setWeeklyCalories] = useState([]);

  useEffect(() => {
    api.getConsistency(weekStart).then(setConsistency).catch(() => {});
    api.getWeighIns(20).then(d => setWeighIns([...d].reverse())).catch(() => {});
    api.getProgression('Deadlift').then(setDeadliftProg).catch(() => {});
    api.getProgression('Bench Press').then(setBenchProg).catch(() => {});
    api.getProgression('Pull-ups').then(setPullupProg).catch(() => {});
    api.getWeeklyMultiFood(4).then(setWeeklyCalories).catch(() => {});
  }, [weekStart]);

  const weekDays = getWeekDays(weekStart);
  const weeklyBudget = weekDays.reduce((sum, d) => sum + getDayType(d, settings).target, 0);

  const calorieBars = weeklyCalories.map((week, i) => {
    const actual = week.days.reduce((s, d) => s + d.calories, 0);
    const budget = getWeekDays(week.weekStart).reduce((s, d) => s + getDayType(d, settings).target, 0);
    return { week: `W${i + 1}`, actual, budget };
  });

  const latestWeight = weighIns.length ? weighIns[weighIns.length - 1].weight : null;
  const latestWaist = weighIns.length ? weighIns[weighIns.length - 1].waist : null;
  const weightDelta = latestWeight != null ? (latestWeight - settings.start_weight).toFixed(1) : null;
  const startWaist = 36; // approximate start waist (not in settings, use first weigh-in with waist)
  const firstWaist = weighIns.find(w => w.waist)?.waist;

  return (
    <div style={{ padding: '16px 12px' }}>

      {/* Consistency */}
      <div style={{ ...card }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>THIS WEEK</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <ConsistencyTile label="Lifts" count={consistency?.lifts ?? 0} target={3} />
          <ConsistencyTile label="Sport+Cardio" count={consistency?.sport ?? 0} target={4} />
          <ConsistencyTile label="Neck" count={consistency?.neck ?? 0} target={4} />
          <ConsistencyTile label="Core" count={consistency?.core ?? 0} target={2} />
          <ConsistencyTile label="Abs" count={consistency?.abs ?? 0} target={2} />
          <ConsistencyTile label="Stretch" count={consistency?.stretch ?? 0} target={4} />
        </div>
      </div>

      {/* Weight & Waist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ background: '#1E2328', borderRadius: 12, padding: '12px 14px', border: '1px solid #2A2F38' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>WEIGHT</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700 }}>
            {latestWeight ?? '—'}
            <span style={{ fontSize: 14, color: '#9CA3AF' }}> lbs</span>
          </div>
          {weightDelta != null && (
            <div style={{ fontSize: 12, color: parseFloat(weightDelta) <= 0 ? '#5FBF7E' : '#FF6B35' }}>
              {parseFloat(weightDelta) <= 0 ? '▼' : '▲'} {Math.abs(weightDelta)} from start
            </div>
          )}
          <Sparkline data={weighIns.slice(-14).map(w => ({ value: w.weight }))} />
        </div>
        <div style={{ background: '#1E2328', borderRadius: 12, padding: '12px 14px', border: '1px solid #2A2F38' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>WAIST</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700 }}>
            {latestWaist ?? '—'}
            <span style={{ fontSize: 14, color: '#9CA3AF' }}> in</span>
          </div>
          {latestWaist && firstWaist && (
            <div style={{ fontSize: 12, color: latestWaist <= firstWaist ? '#5FBF7E' : '#FF6B35' }}>
              {latestWaist <= firstWaist ? '▼' : '▲'} {Math.abs(latestWaist - firstWaist).toFixed(1)} in
            </div>
          )}
          <Sparkline data={weighIns.filter(w => w.waist).slice(-14).map(w => ({ value: w.waist }))} color="#5FBF7E" />
        </div>
      </div>

      {/* Key Lifts */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>KEY LIFTS</div>
        {[
          { label: 'Deadlift', data: deadliftProg },
          { label: 'Bench Press', data: benchProg },
          { label: 'Pull-ups', data: pullupProg },
        ].map(({ label, data }) => {
          const latest = data.length ? data[data.length - 1] : null;
          return (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 600 }}>{label}</span>
                {latest && (
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: 20, color: '#FF6B35' }}>
                    {latest.topWeight} × {latest.reps}
                  </span>
                )}
              </div>
              {data.length > 1 ? (
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="topWeight" stroke="#FF6B35" strokeWidth={2} dot={false} />
                    <Tooltip
                      contentStyle={{ background: '#1E2328', border: 'none', fontSize: 12 }}
                      formatter={v => [`${v} lbs`]}
                      labelFormatter={l => l}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 50, display: 'flex', alignItems: 'center', color: '#6B7280', fontSize: 12 }}>No data yet</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Calorie Bars */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>WEEKLY CALORIES</div>
        {calorieBars.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={calorieBars} barGap={4}>
              <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1E2328', border: 'none', fontSize: 12 }}
                formatter={(v, n) => [v.toLocaleString(), n === 'actual' ? 'Actual' : 'Budget']}
              />
              <Bar dataKey="budget" fill="#2A2F38" radius={[4, 4, 0, 0]} name="budget" />
              <Bar dataKey="actual" fill="#FF6B35" radius={[4, 4, 0, 0]} name="actual" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#6B7280', fontSize: 13 }}>No data yet</div>
        )}
      </div>
    </div>
  );
}
