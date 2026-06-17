import React, { useState, useEffect, useRef, useCallback } from 'react'

export default function IntervalTimer({ onClose, onComplete }) {
  const TOTAL_SETS = 10
  const WORK_SECONDS = 50
  const REST_SECONDS = 10

  const [phase, setPhase] = useState('work') // 'work' | 'rest'
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS)
  const [currentSet, setCurrentSet] = useState(1)
  const [completedSets, setCompletedSets] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const audioCtxRef = useRef(null)
  const intervalRef = useRef(null)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const playBeep = useCallback((frequency, duration = 0.15, type = 'sine') => {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch (e) {
      // ignore audio errors
    }
  }, [getAudioCtx])

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1

        // Countdown beeps at 3, 2, 1
        if (next === 3 || next === 2 || next === 1) {
          if (phase === 'work') playBeep(880, 0.1)
          else playBeep(440, 0.1)
        }

        if (next <= 0) {
          // Transition beep
          playBeep(phase === 'work' ? 660 : 550, 0.3)

          if (phase === 'work') {
            setPhase('rest')
            return REST_SECONDS
          } else {
            // End of rest: either next set or done
            setCompletedSets(cs => cs + 1)
            setCurrentSet(cs => {
              const nextSet = cs + 1
              if (nextSet > TOTAL_SETS) {
                setIsRunning(false)
                setIsDone(true)
                clearInterval(intervalRef.current)
                return cs
              }
              return nextSet
            })
            setPhase('work')
            return WORK_SECONDS
          }
        }
        return next
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, phase, playBeep])

  useEffect(() => {
    if (isDone && onComplete) {
      onComplete()
    }
  }, [isDone])

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const phaseColor = phase === 'work' ? '#FF6B35' : '#5FBF7E'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.97)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      {isDone ? (
        <>
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: 36, color: '#5FBF7E', fontWeight: 700 }}>
            Complete!
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 16 }}>All 10 sets finished. Core logged!</p>
          <button
            onClick={onClose}
            style={{
              background: '#5FBF7E', color: 'white', border: 'none',
              borderRadius: 12, padding: '14px 40px', fontSize: 18,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed',
            }}
          >
            Close
          </button>
        </>
      ) : (
        <>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            color: phaseColor,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}>
            {phase}
          </div>

          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 100,
            fontWeight: 700,
            color: phaseColor,
            lineHeight: 1,
          }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{ color: '#9CA3AF', fontSize: 20, fontFamily: 'Barlow Condensed' }}>
            Set {currentSet} of {TOTAL_SETS}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: TOTAL_SETS }).map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: i < completedSets ? '#5FBF7E' : (i === completedSets ? phaseColor : '#3D4149'),
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <button
              onClick={() => {
                getAudioCtx() // init audio on user gesture
                setIsRunning(r => !r)
              }}
              style={{
                background: phaseColor, color: 'white', border: 'none',
                borderRadius: 12, padding: '14px 40px', fontSize: 20,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed',
              }}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#3D4149', color: 'white', border: 'none',
                borderRadius: 12, padding: '14px 24px', fontSize: 20,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
