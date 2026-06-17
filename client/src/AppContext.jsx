import React, { createContext, useContext, useState, useEffect } from 'react';
import { todayStr } from './utils';
import { api } from './api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeDate, setActiveDate] = useState(todayStr());
  const [settings, setSettings] = useState({
    weekday_target: 1900,
    friday_target: 2100,
    weekend_target: 2450,
    protein_target: 150,
    start_weight: 175,
    goal_weight: 156,
    goal_waist: 30.5,
    goal_date: '2026-09-03',
  });

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const refreshSettings = () => api.getSettings().then(setSettings).catch(() => {});

  return (
    <AppContext.Provider value={{ activeDate, setActiveDate, settings, refreshSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
