import React from 'react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )},
  { id: 'today', label: 'Today', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
  { id: 'food', label: 'Food', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  )},
  { id: 'train', label: 'Train', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/>
    </svg>
  )},
  { id: 'sport', label: 'Sport', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  )},
  { id: 'body', label: 'Body', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )},
]

export default function BottomNav({ activeScreen, setActiveScreen }) {
  return (
    <nav style={{
      display: 'flex',
      background: '#1E2328',
      borderTop: '1px solid #2D3139',
      position: 'sticky',
      bottom: 0,
      zIndex: 100,
    }}>
      {tabs.map(tab => {
        const active = activeScreen === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveScreen(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#FF6B35' : '#9CA3AF',
              fontSize: 10,
              fontFamily: 'Archivo, sans-serif',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
