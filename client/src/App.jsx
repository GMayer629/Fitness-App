import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './screens/Dashboard'
import Today from './screens/Today'
import Food from './screens/Food'
import Train from './screens/Train'
import Sport from './screens/Sport'
import Body from './screens/Body'

function AppInner() {
  const { activeDate, setActiveDate } = useApp()
  const [activeScreen, setActiveScreen] = useState('today')
  const today = new Date().toISOString().slice(0, 10)

  const screens = {
    dashboard: <Dashboard />,
    today: <Today />,
    food: <Food />,
    train: <Train />,
    sport: <Sport />,
    body: <Body />,
  }

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#14171C' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#1E2328',
        borderBottom: '1px solid #2D3139',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#FF6B35',
          letterSpacing: 1,
        }}>FitLog</span>
        <input
          type="date"
          value={activeDate}
          onChange={e => setActiveDate(e.target.value)}
          style={{
            background: '#14171C',
            border: '1px solid #3D4149',
            color: 'white',
            borderRadius: 8,
            padding: '6px 10px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 14,
          }}
        />
      </header>

      {/* Backdating banner */}
      {activeDate !== today && (
        <div style={{
          background: '#F59E0B',
          color: '#1a1a1a',
          textAlign: 'center',
          padding: '6px 16px',
          fontSize: 13,
          fontWeight: 500,
        }}>
          Viewing {formatDate(activeDate)} — backdating mode
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {screens[activeScreen]}
      </main>

      <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
