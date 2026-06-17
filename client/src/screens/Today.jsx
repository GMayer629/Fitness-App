import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { getMondayOfWeek, getDayType } from '../utils';
import { api } from '../api';

const card = {
  background: '#1E2328', borderRadius: 12, padding: '14px 16px',
  marginBottom: 12, border: '1px solid #2A2F38',
};

// --- Interval Timer ---
function IntervalTimer({ onComplete, onClose }) {
  const SETS = 10;
  const WORK = 50;
  const REST = 10;

  const [phase, setPhase] = useState('work'); // 'work' | 'rest' | 'done'
  const [timeLeft, setTimeLeft] = useState(WORK);
  const [setNum, setSetNum] = useState(1);
  const [paused, setPaused] = useState(false);
  const audioCtx = useRef(null);

  function getAudioCtx() {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  }

  function beep(freq = 880, duration = 0.1, volume = 0.4) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  useEffect(() => {
    if (paused || phase === 'done') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 3 && t > 1) beep(660, 0.08);
        if (t === 1) {
          if (phase === 'work') {
            if (setNum >= SETS) {
              setPhase('done');
              beep(1046, 0.5);
              onComplete && onComplete();
              return 0;
            } else {
              setPhase('rest');
              setTimeLeft(REST);
              beep(440, 0.2);
              return REST;
            }
          } else {
            setSetNum(n => n + 1);
            setPhase('work');
            setTimeLeft(WORK);
            beep(880, 0.2);
            return WORK;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, phase, setNum]);

  if (phase === 'done') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#14171C', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 48, color: '#5FBF7E', fontWeight: 700 }}>DONE!</div>
        <div style={{ color: '#9CA3AF', marginTop: 8, marginBottom: 32 }}>Core checked off</div>
        <button onClick={onClose} style={{ background: '#FF6B35', border: 'none', color: '#fff', borderRadius: 10, padding: '12px 32px', fontFamily: 'Barlow Condensed', fontSize: 18, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  const isWork = phase === 'work';
  const phaseColor = isWork ? '#FF6B35' : '#5FBF7E';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#14171C', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 20, color: '#9CA3AF', letterSpacing: 2 }}>SET {setNum} / {SETS}</div>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 28, fontWeight: 700, color: phaseColor, letterSpacing: 3 }}>{isWork ? 'WORK' : 'REST'}</div>
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 120, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{timeLeft}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={() => setPaused(p => !p)}
          style={{ background: '#2A2F38', border: 'none', color: '#fff', borderRadius: 10, padding: '12px 32px', fontFamily: 'Barlow Condensed', fontSize: 18, cursor: 'pointer' }}
        >
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #3A4048', color: '#9CA3AF', borderRadius: 10, padding: '12px 24px', fontFamily: 'Barlow Condensed', fontSize: 18, cursor: 'pointer' }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

const ITEMS = ['neck', 'core', 'abs', 'stretch'];
const ITEM_TARGETS = { neck: 4, core: 2, abs: 2, stretch: 4 };

export default function Today({ onNavigate }) {
  const { activeDate, settings } = useApp();
  const weekStart = getMondayOfWeek(activeDate);

  const [checklist, setChecklist] = useState([]);
  const [weeklyChecklist, setWeeklyChecklist] = useState({});
  const [food, setFood] = useState([]);
  const [latestWeighIn, setLatestWeighIn] = useState(null);
  const [showTimer, setShowTimer] = useState(false);

  const load = () => {
    api.getChecklist(activeDate).then(setChecklist).catch(() => {});
    api.getWeeklyChecklist(weekStart).then(setWeeklyChecklist).catch(() => {});
    api.getFood(activeDate).then(setFood).catch(() => {});
    api.getLatestWeighIn().then(setLatestWeighIn).catch(() => {});
  };

  useEffect(() => { load(); }, [activeDate]);

  const toggleItem = async (item) => {
    if (checklist.includes(item)) {
      await api.deleteChecklist(item, activeDate);
    } else {
      await api.addChecklist(item, activeDate);
    }
    load();
  };

  const handleCoreComplete = async () => {
    if (!checklist.includes('core')) {
      await api.addChecklist('core', activeDate);
    }
    load();
    setShowTimer(false);
  };

  const handleTiffxdan = async () => {
    if (!checklist.includes('abs')) {
      await api.addChecklist('abs', activeDate);
      load();
    }
  };

  const { target } = getDayType(activeDate, settings);
  const totalCals = food.reduce((s, f) => s + f.calories, 0);
  const totalProtein = food.reduce((s, f) => s + f.protein, 0);
  const remaining = target - totalCals;

  return (
    <div style={{ padding: '16px 12px' }}>
      {showTimer && (
        <IntervalTimer
          onComplete={handleCoreComplete}
          onClose={() => setShowTimer(false)}
        />
      )}

      {/* Guided Routines */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>GUIDED ROUTINES</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowTimer(true)}
            style={{ flex: 1, background: '#FF6B35', border: 'none', color: '#fff', borderRadius: 10, padding: '12px 8px', fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Golf Core 10-min
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>50s/10s × 10 sets</div>
          </button>
          <button
            onClick={handleTiffxdan}
            style={{ flex: 1, background: checklist.includes('abs') ? '#2A4A35' : '#2A2F38', border: `1px solid ${checklist.includes('abs') ? '#5FBF7E' : '#3A4048'}`, color: '#fff', borderRadius: 10, padding: '12px 8px', fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Tiffxdan
            <div style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginTop: 2 }}>
              {checklist.includes('abs') ? '✓ Abs done' : 'Marks abs done'}
            </div>
          </button>
        </div>
      </div>

      {/* Daily Checklist */}
      <div style={card}>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 }}>DAILY CHECKLIST</div>
        {ITEMS.map(item => {
          const done = checklist.includes(item);
          const weekCount = weeklyChecklist[item] || 0;
          const target = ITEM_TARGETS[item];
          return (
            <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <button
                onClick={() => toggleItem(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: done ? '#1A3529' : '#252A31',
                  border: `1px solid ${done ? '#5FBF7E' : '#3A4048'}`,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer', flex: 1
                }}
              >
                <span style={{ fontSize: 18, color: done ? '#5FBF7E' : '#6B7280' }}>{done ? '✓' : '○'}</span>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: 16, color: '#fff', textTransform: 'capitalize' }}>{item}</span>
              </button>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: 14, color: weekCount >= target ? '#5FBF7E' : '#9CA3AF', marginLeft: 12, minWidth: 60, textAlign: 'right' }}>
                {weekCount}/{target} wk
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* Calories */}
        <div style={{ background: '#1E2328', borderRadius: 12, padding: '14px', border: '1px solid #2A2F38' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>CALORIES LEFT</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: 700, color: remaining >= 0 ? '#5FBF7E' : '#FF6B35' }}>
            {remaining}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{totalCals} / {target}</div>
          <div style={{ marginTop: 8, background: '#2A2F38', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: remaining >= 0 ? '#5FBF7E' : '#FF6B35', width: `${Math.min(100, (totalCals / target) * 100)}%`, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Protein */}
        <div style={{ background: '#1E2328', borderRadius: 12, padding: '14px', border: '1px solid #2A2F38' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>PROTEIN</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 36, fontWeight: 700, color: totalProtein >= settings.protein_target ? '#5FBF7E' : '#fff' }}>
            {totalProtein}g
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>goal {settings.protein_target}g</div>
          <div style={{ marginTop: 8, background: '#2A2F38', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#5FBF7E', width: `${Math.min(100, (totalProtein / settings.protein_target) * 100)}%`, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Weight tile */}
      <div
        style={{ ...card, cursor: 'pointer' }}
        onClick={() => onNavigate && onNavigate('body')}
      >
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>TODAY'S WEIGHT</div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: 32, fontWeight: 700 }}>
          {latestWeighIn?.weight ?? '—'}
          <span style={{ fontSize: 14, color: '#9CA3AF' }}> lbs</span>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Tap to log weigh-in →</div>
      </div>
    </div>
  );
}
