import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { todayStr, formatDate } from './utils';
import Dashboard from './screens/Dashboard';
import Today from './screens/Today';
import Food from './screens/Food';
import Train from './screens/Train';
import Sport from './screens/Sport';
import Body from './screens/Body';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'today', label: 'Today', icon: '✦' },
  { id: 'food', label: 'Food', icon: '⊕' },
  { id: 'train', label: 'Train', icon: '◉' },
  { id: 'sport', label: 'Sport', icon: '◎' },
  { id: 'body', label: 'Body', icon: '◐' },
];

function Shell() {
  const [screen, setScreen] = useState('dashboard');
  const { activeDate, setActiveDate } = useApp();
  const isToday = activeDate === todayStr();

  const screens = {
    dashboard: <Dashboard />,
    today: <Today onNavigate={setScreen} />,
    food: <Food />,
    train: <Train />,
    sport: <Sport />,
    body: <Body />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#14171C', color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#1E2328', borderBottom: '1px solid #2A2F38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 22, color: '#FF6B35', letterSpacing: 1 }}>FITLOG</span>
        <input
          type="date"
          value={activeDate}
          onChange={e => setActiveDate(e.target.value)}
          style={{
            background: '#2A2F38', border: '1px solid #3A4048', borderRadius: 8,
            color: '#fff', padding: '4px 10px', fontSize: 14, fontFamily: 'Archivo',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Backdating banner */}
      {!isToday && (
        <div style={{ background: '#7C5A00', color: '#FFD369', padding: '6px 16px', fontSize: 13, textAlign: 'center', flexShrink: 0 }}>
          Viewing {formatDate(activeDate)} — backdating mode
        </div>
      )}

      {/* Screen content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screens[screen]}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', background: '#1E2328', borderTop: '1px solid #2A2F38', flexShrink: 0 }}>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setScreen(n.id)}
            style={{
              flex: 1, border: 'none', background: 'none', padding: '8px 4px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer',
              color: screen === n.id ? '#FF6B35' : '#6B7280',
              borderTop: screen === n.id ? '2px solid #FF6B35' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: 11, letterSpacing: 0.5 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
