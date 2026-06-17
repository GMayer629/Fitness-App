import React, { createContext, useContext, useState, useEffect } from 'react'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const today = new Date().toISOString().slice(0, 10)
  const [activeDate, setActiveDate] = useState(today)
  const [settings, setSettings] = useState({
    weekday_target: 1900,
    friday_target: 2100,
    weekend_target: 2450,
    protein_target: 150,
    start_weight: 175,
    goal_weight: 156,
    goal_waist: 30.5,
    goal_date: '2026-09-03'
  })

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data) setSettings(data)
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  return (
    <AppContext.Provider value={{ activeDate, setActiveDate, settings, refreshSettings }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
