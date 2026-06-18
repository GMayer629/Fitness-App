import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ClipboardCheck, Utensils, Dumbbell, TrendingUp, Plus, X, RotateCcw, Settings, Check, LayoutDashboard, Trophy, Download,
} from "lucide-react";

/* ---------- constants ---------- */
const C = {
  bg: "#14171C", card: "#1C2128", card2: "#222831", border: "#2C3440",
  text: "#E9E7E1", muted: "#97A0AC", accent: "#FF6B35", green: "#5FBF7E",
  yellow: "#E8C547", red: "#E05B5B",
};

const TEMPLATES = {
  "Upper": [
    "Bench Press", "Pull-ups", "Incline Bench", "Incline Rows",
    "Cable Rows", "Cable Shoulder Press", "Face Pulls",
  ],
  "Legs": [
    "Deadlift", "Squat", "Straight-Leg Deadlift", "Hamstring Curls",
    "Calf Raises", "Banded Side Steps",
  ],
  "Arms (current)": [
    "Barbell Curls", "Close-Grip Bench", "Incline DB Curl", "OH Rope Extension",
    "Hammer Curls", "Tricep Pushdown", "Lat Raises", "Rear Delt Flies",
  ],
  "Arms + Athletic (rec.)": [
    "Split Squats", "Pallof Press", "Barbell Curls", "Close-Grip Bench",
    "Hammer Curls", "Tricep Pushdown", "Lat Raises", "Rear Delt Flies",
  ],
  "Home (DB)": [
    "DB Bench", "Pull-ups", "DB Rows", "DB Shoulder Press",
    "DB Split Squats", "DB RDL", "DB Curls", "Lat Raises",
  ],
};

const CHECK_ITEMS = [
  { id: "neck", label: "Neck routine (tucks · WYT · raises)", target: 4 },
  { id: "core", label: "Golf core · 10 min", target: 2 },
  { id: "abs", label: "Abs · tiffxdan", target: 2 },
  { id: "stretch", label: "Golf stretch · 15 min", target: 4 },
];

const todayKey = () => new Date().toLocaleDateString("en-CA");
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
};
const lastNDates = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toLocaleDateString("en-CA"));
  }
  return out;
};
const isWeekendDay = (iso) => {
  const day = new Date(iso + "T12:00:00").getDay();
  return day === 6 || day === 0;
};
const isFriday = (iso) => new Date(iso + "T12:00:00").getDay() === 5;
const targetFor = (iso, s) =>
  isWeekendDay(iso) ? s.weekendTarget : isFriday(iso) ? (s.fridayTarget ?? s.weekdayTarget) : s.weekdayTarget;
const dayTypeLabel = (iso) => (isWeekendDay(iso) ? " · wknd" : isFriday(iso) ? " · fri" : "");
const currentWeekDates = () => {
  const now = new Date();
  const monOffset = (now.getDay() + 6) % 7;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - monOffset + i);
    out.push(d.toLocaleDateString("en-CA"));
  }
  return out;
};

const seed = () => ({
  settings: {
    weekdayTarget: 1900, fridayTarget: 2100, weekendTarget: 2450, proteinTarget: 150,
    startWeight: 175, goalWeight: 156, goalWaist: 30.5, goalDate: "2026-09-03",
  },
  meals: [
    { id: "m001", name: "Homemade protein shake", cal: 415, protein: 37 },
    { id: "m002", name: "Flank steak dinner", cal: 950, protein: 72 },
    { id: "m003", name: "Salmon + broccoli", cal: 650, protein: 45 },
    { id: "m004", name: "Chicken breast + asparagus", cal: 540, protein: 75 },
    { id: "m005", name: "Greek salad + chicken", cal: 700, protein: 60 },
    { id: "m006", name: "NY strip + broccoli", cal: 750, protein: 58 },
    { id: "m007", name: "Premier protein shake", cal: 160, protein: 30 },
    { id: "m008", name: "Turkey hoagie 6 inch", cal: 700, protein: 40 },
    { id: "m009", name: "Chobani coconut yogurt", cal: 140, protein: 12 },
    { id: "m010", name: "Wine — glass red", cal: 125, protein: 0 },
    { id: "m011", name: "Wine — glass white", cal: 125, protein: 0 },
    { id: "m012", name: "Vodka soda", cal: 100, protein: 0 },
    { id: "m013", name: "Pilsner beer", cal: 150, protein: 0 },
    { id: "m014", name: "Surfside vodka iced tea", cal: 160, protein: 0 },
    { id: "m015", name: "Two eggs griddle-fried", cal: 200, protein: 12 },
    { id: "m016", name: "Pork roll (3 slices)", cal: 200, protein: 14 },
    { id: "m017", name: "Two toast with butter", cal: 250, protein: 6 },
    { id: "m018", name: "Two pancakes butter + syrup", cal: 650, protein: 8 },
    { id: "m019", name: "Pizza slice (cheese)", cal: 300, protein: 12 },
    { id: "m020", name: "Salad (side)", cal: 200, protein: 3 },
  ],
  foodLog: {},
  lifts: {},
  weighIns: [
    { date: "2026-01-01", weight: 175 },
    { date: "2026-06-17", weight: 160, waist: 32 },
  ],
  checklist: {},
  sports: {},
});

/* ---------- shared ui ---------- */
const Card = ({ children, style }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: 14, ...style,
  }}>{children}</div>
);

const Eyebrow = ({ children }) => (
  <div style={{
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 13,
    letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 8,
  }}>{children}</div>
);

const Big = ({ children, color }) => (
  <span style={{
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 34,
    color: color || C.text, fontVariantNumeric: "tabular-nums", lineHeight: 1,
  }}>{children}</span>
);

const Btn = ({ onClick, children, kind = "solid", small, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: kind === "solid" ? C.accent : "transparent",
    color: kind === "solid" ? "#14171C" : C.accent,
    border: kind === "solid" ? "none" : `1px solid ${C.accent}`,
    borderRadius: 8, padding: small ? "6px 10px" : "10px 14px",
    fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: small ? 13 : 14,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
    display: "inline-flex", alignItems: "center", gap: 6,
  }}>{children}</button>
);

const Input = (props) => (
  <input {...props} style={{
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "9px 10px", fontSize: 15, fontFamily: "'Archivo', sans-serif",
    width: "100%", boxSizing: "border-box", ...props.style,
  }} />
);

/* ---------- barbell goal meter ---------- */
function BarbellMeter({ start, current, goal }) {
  const totalLbs = Math.max(start - goal, 1);
  const lost = Math.min(Math.max(start - current, 0), totalLbs);
  const slots = Math.round(totalLbs);
  const filled = Math.floor(lost);
  const W = 320, H = 64, barY = H / 2;
  const sleeveX = 56, sleeveW = W - 100;
  const plateW = Math.min(16, (sleeveW - 8) / slots - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <rect x={8} y={barY - 3} width={W - 16} height={6} rx={3} fill="#4A5260" />
      <rect x={sleeveX - 10} y={barY - 12} width={8} height={24} rx={2} fill="#5C6675" />
      {Array.from({ length: slots }).map((_, i) => {
        const x = sleeveX + i * (plateW + 5);
        const on = i < filled;
        return (
          <rect key={i} x={x} y={barY - (on ? 24 : 16)} width={plateW}
            height={on ? 48 : 32} rx={3}
            fill={on ? C.accent : "transparent"}
            stroke={on ? C.accent : "#3A424F"} strokeWidth={1.5} strokeDasharray={on ? "0" : "4 3"} />
        );
      })}
      <text x={W - 8} y={barY - 18} textAnchor="end" fill={C.muted} fontSize={11}
        fontFamily="'Archivo', sans-serif">{lost.toFixed(1)} of {totalLbs} lbs</text>
      <text x={W - 8} y={barY + 28} textAnchor="end" fill={C.muted} fontSize={11}
        fontFamily="'Archivo', sans-serif">plates = lbs to {goal}</text>
    </svg>
  );
}

/* ---------- dashboard ---------- */
const Spark = ({ series, color }) => (
  <div style={{ width: 84, height: 36, flexShrink: 0 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const Delta = ({ value, goodWhenDown, unit }) => {
  if (value === 0) return <span style={{ color: C.muted, fontSize: 13 }}>—</span>;
  const good = goodWhenDown ? value < 0 : value > 0;
  return (
    <span style={{
      color: good ? C.green : C.yellow, fontSize: 13, fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
    }}>{value > 0 ? "+" : ""}{value}{unit}</span>
  );
};

const KEY_LIFTS = ["Deadlift", "Bench Press", "Pull-ups"];

function DashTab({ data }) {
  const s = data.settings;
  const sorted = useMemo(() => [...data.weighIns].sort((a, b) => a.date.localeCompare(b.date)), [data.weighIns]);
  const latest = sorted[sorted.length - 1];
  const wDelta = latest ? +(latest.weight - s.startWeight).toFixed(1) : 0;
  const waists = sorted.filter((x) => x.waist != null);
  const latestWaist = waists[waists.length - 1];
  const waistDelta = waists.length >= 2 ? +(latestWaist.waist - waists[0].waist).toFixed(2) : 0;

  const topPerDay = (ex) => {
    const byDate = {};
    (data.lifts[ex] || []).forEach((st) => {
      const cur = byDate[st.date];
      if (!cur || st.weight > cur.weight || (st.weight === cur.weight && st.reps > cur.reps)) byDate[st.date] = st;
    });
    return Object.keys(byDate).sort().map((d) => byDate[d]);
  };

  const liftStat = (ex) => {
    const days = topPerDay(ex);
    if (!days.length) return null;
    const useWeight = days.some((d) => d.weight > 0);
    const series = days.map((d) => ({ v: useWeight ? d.weight : d.reps }));
    const last = days[days.length - 1], first = days[0];
    const delta = useWeight ? last.weight - first.weight : last.reps - first.reps;
    return {
      label: useWeight ? `${last.weight} × ${last.reps}` : `${last.reps} reps`,
      delta, unit: useWeight ? " lb" : "r", series, sessions: days.length,
    };
  };

  const weekBudget = 4 * s.weekdayTarget + (s.fridayTarget ?? s.weekdayTarget) + 2 * s.weekendTarget;
  const weeks = [];
  const thisMon = currentWeekDates()[0];
  for (let o = 3; o >= 0; o--) {
    const m = new Date(thisMon + "T12:00:00");
    m.setDate(m.getDate() - 7 * o);
    let total = 0, logged = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(m); d.setDate(m.getDate() + i);
      const k = d.toLocaleDateString("en-CA");
      const dayCal = (data.foodLog[k] || []).reduce((s3, e) => s3 + (e.cal || 0), 0);
      total += dayCal;
      if (dayCal > 0) logged++;
    }
    weeks.push({ label: `wk of ${fmtDate(m.toLocaleDateString("en-CA"))}`, total, logged, current: o === 0 });
  }
  const weightSeries = sorted.map((x) => ({ v: x.weight }));

  const wk = currentWeekDates();
  const liftDays = wk.filter((d) =>
    Object.values(data.lifts).some((h) => (h || []).some((s2) => s2.date === d))
  ).length;
  const sportSessions = wk.reduce((n, d) => n + ((data.sports || {})[d] || []).length, 0);
  const checkCount = (id) => wk.filter((d) => data.checklist[d]?.[id]).length;
  const consistency = [
    { label: "Lifts", n: liftDays, target: 3 },
    { label: "Sprt·Cdo", n: sportSessions, target: 4 },
    { label: "Neck", n: checkCount("neck"), target: 4 },
    { label: "Core", n: checkCount("core"), target: 2 },
    { label: "Abs", n: checkCount("abs"), target: 2 },
    { label: "Stretch", n: checkCount("stretch"), target: 4 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <Eyebrow>Consistency — this week</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {consistency.map((m) => (
            <div key={m.label} style={{
              textAlign: "center", background: C.card2, borderRadius: 8, padding: "8px 2px",
              border: `1px solid ${m.n >= m.target ? C.green : C.border}`,
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19,
                color: m.n >= m.target ? C.green : C.text, fontVariantNumeric: "tabular-nums",
              }}>{m.n}/{m.target}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card>
          <Eyebrow>Weight</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <Big>{latest?.weight ?? "—"}</Big>
            <Delta value={wDelta} goodWhenDown unit=" lb" />
          </div>
          {weightSeries.length >= 2 && <div style={{ marginTop: 6 }}><Spark series={weightSeries} color={C.accent} /></div>}
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>goal {s.goalWeight}</div>
        </Card>
        <Card>
          <Eyebrow>Waist</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <Big>{latestWaist ? `${latestWaist.waist}"` : "—"}</Big>
            <Delta value={waistDelta} goodWhenDown unit={'"'} />
          </div>
          {waists.length >= 2 && <div style={{ marginTop: 6 }}><Spark series={waists.map((x) => ({ v: x.waist }))} color={C.accent} /></div>}
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>goal {s.goalWaist}"</div>
        </Card>
      </div>

      <Card>
        <Eyebrow>Key lifts — top set</Eyebrow>
        {KEY_LIFTS.map((ex) => {
          const st = liftStat(ex);
          return (
            <div key={ex} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{ex}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>
                  {st ? `${st.sessions} session${st.sessions > 1 ? "s" : ""}` : "no sets logged"}
                </div>
              </div>
              {st && (
                <>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20,
                      fontVariantNumeric: "tabular-nums",
                    }}>{st.label}</div>
                    <Delta value={st.delta} goodWhenDown={false} unit={st.unit} />
                  </div>
                  {st.series.length >= 2 && <Spark series={st.series} color={C.green} />}
                </>
              )}
            </div>
          );
        })}
      </Card>

      <Card>
        <Eyebrow>Weekly calories vs {weekBudget.toLocaleString()} budget</Eyebrow>
        {weeks.map((w2) => {
          const ratio = Math.min(w2.total / weekBudget, 1.25);
          const over = w2.total > weekBudget;
          return (
            <div key={w2.label} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: w2.current ? C.text : C.muted, fontWeight: w2.current ? 600 : 400 }}>
                  {w2.label}{w2.current ? " (current)" : ""}
                </span>
                <span style={{ color: w2.total === 0 ? C.muted : over ? C.red : C.text, fontVariantNumeric: "tabular-nums" }}>
                  {w2.total === 0 ? "no logs" : `${w2.total.toLocaleString()}${w2.logged < 7 && !w2.current ? ` · ${w2.logged}/7 days` : ""}`}
                </span>
              </div>
              <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                <div style={{ height: 6, width: `${(ratio / 1.25) * 100}%`, background: over ? C.red : C.green, borderRadius: 3, opacity: w2.current ? 1 : 0.6 }} />
              </div>
            </div>
          );
        })}
        <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
          Partial weeks read low — check the days-logged count before reading the bar as a win.
        </div>
      </Card>
    </div>
  );
}

/* ---------- sport ---------- */
const SPORT_TYPES = ["Golf", "Basketball", "Paddle Tennis", "Cardio", "Other"];

function SportTab({ data, mutate, date }) {
  const t = date;
  const [type, setType] = useState("Golf");
  const [mins, setMins] = useState("");
  const [walked, setWalked] = useState("");
  const [cart, setCart] = useState("");
  const [custom, setCustom] = useState("");

  const sports = data.sports || {};
  const entries = sports[t] || [];
  const canLog = type === "Golf" ? (walked || cart || mins) : type === "Other" ? (custom.trim() && mins) : mins;

  const logSport = () => {
    if (!canLog) return;
    let name = type;
    if (type === "Other") name = custom.trim();
    if (type === "Cardio") name = custom.trim() ? `Cardio — ${custom.trim()}` : "Cardio";
    const e = { id: Date.now(), activity: name, minutes: Number(mins) || 0 };
    if (type === "Golf") { e.holesWalked = Number(walked) || 0; e.holesCart = Number(cart) || 0; }
    mutate((d) => { d.sports = { ...(d.sports || {}), [t]: [...((d.sports || {})[t] || []), e] }; });
    setMins(""); setWalked(""); setCart(""); setCustom("");
  };
  const removeEntry = (id) =>
    mutate((d) => { d.sports = { ...d.sports, [t]: (d.sports[t] || []).filter((e) => e.id !== id) }; });

  const wk = currentWeekDates();
  const weekEntries = wk.flatMap((d) => (sports[d] || []).map((e) => ({ ...e, date: d })));
  const totalMin = weekEntries.reduce((s2, e) => s2 + (e.minutes || 0), 0);
  const hWalked = weekEntries.reduce((s2, e) => s2 + (e.holesWalked || 0), 0);
  const hCart = weekEntries.reduce((s2, e) => s2 + (e.holesCart || 0), 0);

  const describe = (e) => {
    const bits = [];
    if (e.holesWalked) bits.push(`${e.holesWalked} walked`);
    if (e.holesCart) bits.push(`${e.holesCart} cart`);
    if (e.minutes) bits.push(`${e.minutes} min`);
    return bits.join(" · ") || "logged";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card>
          <Eyebrow>Sessions</Eyebrow>
          <Big color={weekEntries.length >= 4 ? C.green : C.text}>{weekEntries.length}</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>this wk · target 4</div>
        </Card>
        <Card>
          <Eyebrow>Minutes</Eyebrow>
          <Big>{totalMin}</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>this wk</div>
        </Card>
        <Card>
          <Eyebrow>Holes</Eyebrow>
          <Big>{hWalked + hCart || "—"}</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            {hWalked + hCart > 0 ? `${hWalked} walked / ${hCart} cart` : "this wk"}
          </div>
        </Card>
      </div>

      <Card>
        <Eyebrow>Log activity</Eyebrow>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {SPORT_TYPES.map((k) => (
            <div key={k} onClick={() => setType(k)} style={{
              padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: type === k ? C.accent : C.card,
              color: type === k ? "#14171C" : C.muted,
              border: `1px solid ${type === k ? C.accent : C.border}`,
            }}>{k}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {type === "Other" && (
            <Input placeholder="Activity name" value={custom} onChange={(e) => setCustom(e.target.value)} />
          )}
          {type === "Cardio" && (
            <Input placeholder="Type (optional — run, bike, row...)" value={custom} onChange={(e) => setCustom(e.target.value)} />
          )}
          {type === "Golf" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input placeholder="Holes walked" type="number" inputMode="numeric" value={walked}
                onChange={(e) => setWalked(e.target.value)} />
              <Input placeholder="Holes in cart" type="number" inputMode="numeric" value={cart}
                onChange={(e) => setCart(e.target.value)} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <Input placeholder={type === "Golf" ? "Minutes (optional)" : "Minutes"} type="number" inputMode="numeric"
              value={mins} onChange={(e) => setMins(e.target.value)} />
            <Btn onClick={logSport} disabled={!canLog}><Plus size={15} /> Log</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <Eyebrow>This week</Eyebrow>
        {weekEntries.length === 0 && <div style={{ color: C.muted, fontSize: 14 }}>Nothing logged yet this week.</div>}
        {weekEntries.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{e.activity}</span>
              <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>{describe(e)}</span>
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginRight: 10 }}>{fmtDate(e.date)}</div>
            {e.date === t && <X size={15} color={C.muted} style={{ cursor: "pointer" }} onClick={() => removeEntry(e.id)} />}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- interval timers ---------- */
const GOLF_CORE = [
  "Dead bug", "Glute bridge march", "Side plank — R", "Side plank — L",
  "Bird dog", "Thread the needle", "Chop low-to-high — R", "Chop low-to-high — L",
  "Plank shoulder taps", "Standing wood chops",
];
const CORE_SEQ = GOLF_CORE.flatMap((name, i) =>
  i < GOLF_CORE.length - 1
    ? [{ name, secs: 50, kind: "work" }, { name: "Rest", secs: 10, kind: "rest", next: GOLF_CORE[i + 1] }]
    : [{ name, secs: 50, kind: "work" }]
);

const GOLF_STRETCH = [
  ["Cat-cow", 60], ["Open book — R", 60], ["Open book — L", 60],
  ["Hip flexor — R", 60], ["Hip flexor — L", 60],
  ["Figure-4 glute — R", 60], ["Figure-4 glute — L", 60],
  ["Hamstring — R", 60], ["Hamstring — L", 60],
  ["Adductor rock-back", 60],
  ["Child's pose reach — R", 60], ["Child's pose reach — L", 60],
  ["Chest opener", 60], ["Wrist + forearm", 60],
  ["Upper trap — R", 30], ["Upper trap — L", 30],
];
const STRETCH_SEQ = GOLF_STRETCH.map(([name, secs]) => ({ name, secs, kind: "work" }));

function IntervalTimer({ audioCtx, title, sequence, workLabel = "Work", doneNote, onFinish, onClose }) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(sequence[0].secs);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const endRef = useRef(Date.now() + sequence[0].secs * 1000);
  const pausedRemRef = useRef(null);
  const lastBeepRef = useRef("");

  const beep = (freq, dur = 0.12, when = 0) => {
    try {
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = freq;
      o.connect(g); g.connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + when;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch { /* sound is best-effort */ }
  };

  useEffect(() => { beep(880); beep(880, 0.12, 0.18); }, []);

  useEffect(() => {
    if (paused || done) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(rem);
      const key = `${idx}-${rem}`;
      if (rem <= 3 && rem >= 1 && lastBeepRef.current !== key) {
        lastBeepRef.current = key;
        beep(620, 0.07);
      }
      if (rem === 0) {
        if (idx === sequence.length - 1) {
          setDone(true);
          beep(740); beep(880, 0.12, 0.2); beep(1100, 0.3, 0.4);
          onFinish();
        } else {
          const n = idx + 1;
          setIdx(n);
          endRef.current = Date.now() + sequence[n].secs * 1000;
          setRemaining(sequence[n].secs);
          if (sequence[n].kind === "rest") beep(520, 0.2);
          else { beep(880); beep(880, 0.12, 0.18); }
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [paused, idx, done]);

  const togglePause = () => {
    if (!paused) {
      pausedRemRef.current = Math.max(0, endRef.current - Date.now());
      setPaused(true);
    } else {
      endRef.current = Date.now() + (pausedRemRef.current ?? 0);
      setPaused(false);
    }
  };

  const cur = sequence[idx];
  const work = cur.kind !== "rest";
  const accent = work ? C.accent : C.green;
  const nextWork = sequence.slice(idx + 1).find((s) => s.kind !== "rest");
  const roundNum = Math.max(1, sequence.slice(0, idx + 1).filter((s) => s.kind !== "rest").length);
  const workPositions = sequence.map((s, i) => i).filter((i) => sequence[i].kind !== "rest");

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.bg, zIndex: 50,
      display: "flex", flexDirection: "column", padding: "24px 20px",
      fontFamily: "'Archivo', sans-serif", color: C.text,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>
          {title} · {roundNum}/{workPositions.length}
        </div>
        <X size={22} color={C.muted} style={{ cursor: "pointer" }} onClick={onClose} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {done ? (
          <>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 44, color: C.green }}>DONE</div>
            <div style={{ color: C.muted, fontSize: 15, textAlign: "center" }}>{doneNote}</div>
            <div style={{ marginTop: 16 }}><Btn onClick={onClose}>Close</Btn></div>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 17,
              letterSpacing: "0.16em", textTransform: "uppercase", color: accent,
            }}>{paused ? "Paused" : work ? workLabel : "Rest"}</div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 110,
              lineHeight: 1, fontVariantNumeric: "tabular-nums", color: paused ? C.muted : C.text,
            }}>{remaining}</div>
            <div style={{ fontSize: 22, fontWeight: 600, textAlign: "center", marginTop: 6 }}>
              {work ? cur.name : `Next: ${cur.next}`}
            </div>
            {work && nextWork && (
              <div style={{ color: C.muted, fontSize: 14 }}>then: {nextWork.name}</div>
            )}
          </>
        )}
      </div>

      {!done && (
        <>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 18 }}>
            {workPositions.map((pos) => (
              <div key={pos} style={{
                flex: 1, maxWidth: 22, height: 5, borderRadius: 3,
                background: pos < idx ? C.green : pos === idx ? accent : C.border,
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", paddingBottom: 8 }}>
            <Btn onClick={togglePause}>{paused ? "Resume" : "Pause"}</Btn>
            <Btn kind="ghost" onClick={onClose}>End</Btn>
          </div>
        </>
      )}
    </div>
  );
}

function TodayTab({ data, mutate, date }) {
  const t = date;
  const [activeTimer, setActiveTimer] = useState(null);
  const [audioCtx, setAudioCtx] = useState(null);

  const startTimer = (kind) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctx.resume();
      setAudioCtx(ctx);
    } catch { setAudioCtx(null); }
    setActiveTimer(kind);
  };
  const finishCheck = (id) =>
    mutate((d) => {
      const day = { ...(d.checklist[t] || {}) };
      day[id] = true;
      d.checklist = { ...d.checklist, [t]: day };
    });
  const checks = data.checklist[t] || {};
  const log = data.foodLog[t] || [];
  const cal = log.reduce((s, e) => s + (e.cal || 0), 0);
  const pro = log.reduce((s, e) => s + (e.protein || 0), 0);
  const latest = [...data.weighIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
  const week = currentWeekDates();
  const weekCount = (id) => week.filter((d) => d <= todayKey() && data.checklist[d]?.[id]).length;
  const toggle = (id) =>
    mutate((d) => {
      const day = { ...(d.checklist[t] || {}) };
      day[id] = !day[id];
      d.checklist = { ...d.checklist, [t]: day };
    });
  const s = data.settings;
  const dayTarget = targetFor(t, s);
  const remaining = dayTarget - cal;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <Eyebrow>Goal · {s.goalWeight} lbs by {fmtDate(s.goalDate)}/{s.goalDate.slice(0, 4)}</Eyebrow>
        <BarbellMeter start={s.startWeight} current={latest?.weight ?? s.startWeight} goal={s.goalWeight} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card>
          <Eyebrow>Cals left</Eyebrow>
          <Big color={remaining < 0 ? C.red : C.text}>{remaining}</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{cal} / {dayTarget}{dayTypeLabel(t)}</div>
        </Card>
        <Card>
          <Eyebrow>Protein</Eyebrow>
          <Big color={pro >= s.proteinTarget ? C.green : C.text}>{pro}g</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>target {s.proteinTarget}g</div>
        </Card>
        <Card>
          <Eyebrow>Weight</Eyebrow>
          <Big>{latest?.weight ?? "—"}</Big>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{latest ? fmtDate(latest.date) : "log one"}</div>
        </Card>
      </div>
      <Card>
        <Eyebrow>Guided routines</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Golf core · 10 min</div>
            <div style={{ color: C.muted, fontSize: 12 }}>10 rounds · 50s on / 10s off · 2x/wk · checks Core</div>
          </div>
          <Btn small onClick={() => startTimer("core")}>Start</Btn>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Abs · tiffxdan</div>
            <div style={{ color: C.muted, fontSize: 12 }}>run independently · 2x/wk · tap to check off</div>
          </div>
          <Btn small kind="ghost" onClick={() => finishCheck("abs")}>✓ Done</Btn>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0 2px" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Golf stretch · 15 min</div>
            <div style={{ color: C.muted, fontSize: 12 }}>16 holds · continuous flow · checks stretch</div>
          </div>
          <Btn small onClick={() => startTimer("stretch")}>Start</Btn>
        </div>
      </Card>
      <Card>
        <Eyebrow>Daily maintenance</Eyebrow>
        {CHECK_ITEMS.map((it) => {
          const on = !!checks[it.id];
          return (
            <div key={it.id} onClick={() => toggle(it.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 4px",
              borderBottom: `1px solid ${C.border}`, cursor: "pointer",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${on ? C.green : C.border}`,
                background: on ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{on && <Check size={16} color="#14171C" strokeWidth={3} />}</div>
              <div style={{ flex: 1, fontSize: 15, color: on ? C.muted : C.text }}>{it.label}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
                color: weekCount(it.id) >= it.target ? C.green : C.muted, fontSize: 15,
              }}>{weekCount(it.id)}/{it.target} this wk</div>
            </div>
          );
        })}
      </Card>
      {activeTimer === "core" && (
        <IntervalTimer audioCtx={audioCtx} title="Golf core" sequence={CORE_SEQ}
          doneNote="10 minutes banked. Golf core checked off for today."
          onFinish={() => finishCheck("core")} onClose={() => setActiveTimer(null)} />
      )}
      {activeTimer === "stretch" && (
        <IntervalTimer audioCtx={audioCtx} title="Golf stretch" sequence={STRETCH_SEQ} workLabel="Hold"
          doneNote="15 minutes banked. Stretch checked off for today."
          onFinish={() => finishCheck("stretch")} onClose={() => setActiveTimer(null)} />
      )}
    </div>
  );
}

function FoodTab({ data, mutate, date }) {
  const t = date;
  const log = data.foodLog[t] || [];
  const cal = log.reduce((s, e) => s + (e.cal || 0), 0);
  const pro = log.reduce((s, e) => s + (e.protein || 0), 0);
  const [form, setForm] = useState({ name: "", cal: "", protein: "", save: true });
  const s = data.settings;
  const dayTarget = targetFor(t, s);
  const week = currentWeekDates();
  const dayTotals = week.map((d) => ({
    date: d,
    cal: (data.foodLog[d] || []).reduce((s2, e) => s2 + (e.cal || 0), 0),
    target: targetFor(d, s),
    future: d > todayKey(),
    today: d === t,
  }));
  const weekBudget = dayTotals.reduce((s2, x) => s2 + x.target, 0);
  const weekConsumed = dayTotals.reduce((s2, x) => s2 + x.cal, 0);

  const addEntry = (entry) =>
    mutate((d) => { d.foodLog = { ...d.foodLog, [t]: [...(d.foodLog[t] || []), entry] }; });

  const addCustom = () => {
    if (!form.name || !form.cal) return;
    const entry = { id: Date.now(), name: form.name, cal: Number(form.cal), protein: Number(form.protein) || 0 };
    mutate((d) => {
      d.foodLog = { ...d.foodLog, [t]: [...(d.foodLog[t] || []), entry] };
      if (form.save) d.meals = [...d.meals, { ...entry, id: "m" + Date.now() }];
    });
    setForm({ name: "", cal: "", protein: "", save: true });
  };

  const repeatYesterday = () => {
    const y = new Date(t + "T12:00:00"); y.setDate(y.getDate() - 1);
    const yk = y.toLocaleDateString("en-CA");
    const prev = data.foodLog[yk] || [];
    if (!prev.length) return;
    mutate((d) => {
      d.foodLog = { ...d.foodLog, [t]: [...(d.foodLog[t] || []), ...prev.map((e) => ({ ...e, id: Date.now() + Math.random() }))] };
    });
  };

  const removeEntry = (id) =>
    mutate((d) => { d.foodLog = { ...d.foodLog, [t]: (d.foodLog[t] || []).filter((e) => e.id !== id) }; });

  const removeMeal = (id) => mutate((d) => { d.meals = d.meals.filter((m) => m.id !== id); });

  const pct = Math.min((cal / dayTarget) * 100, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Eyebrow>Today{isWeekendDay(t) ? " · weekend target" : isFriday(t) ? " · friday target" : ""}</Eyebrow>
          <div style={{ fontSize: 13, color: C.muted }}>{pro}g protein</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <Big color={cal > dayTarget ? C.red : C.text}>{cal}</Big>
          <span style={{ color: C.muted }}>/ {dayTarget} cal</span>
        </div>
        <div style={{ height: 8, background: C.bg, borderRadius: 4, marginTop: 10 }}>
          <div style={{ height: 8, width: `${pct}%`, background: cal > dayTarget ? C.red : C.accent, borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn kind="ghost" small onClick={repeatYesterday}><RotateCcw size={14} /> Copy previous day</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Eyebrow>This week · Mon–Sun</Eyebrow>
          <div style={{ fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
            {weekConsumed.toLocaleString()} / {weekBudget.toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64, marginTop: 6 }}>
          {dayTotals.map((d) => {
            const ratio = d.target ? Math.min(d.cal / d.target, 1.3) : 0;
            const h = Math.max(ratio * 48, d.cal > 0 ? 4 : 0);
            const over = d.cal > d.target;
            const wd = "MTWTFSS"[(new Date(d.date + "T12:00:00").getDay() + 6) % 7];
            return (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", height: 48, background: C.bg, borderRadius: 4, display: "flex", alignItems: "flex-end", overflow: "hidden", border: d.today ? `1px solid ${C.accent}` : `1px solid transparent` }}>
                  <div style={{ width: "100%", height: h, background: d.future ? C.border : over ? C.red : C.green, opacity: d.future ? 0.4 : 1 }} />
                </div>
                <span style={{ fontSize: 11, color: d.today ? C.accent : C.muted, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>{wd}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
          {weekBudget - weekConsumed >= 0
            ? `${(weekBudget - weekConsumed).toLocaleString()} left in the weekly budget`
            : `${(weekConsumed - weekBudget).toLocaleString()} over budget — trim weekdays, don't crash-cut`}
        </div>
      </Card>

      {log.length > 0 && (
        <Card>
          <Eyebrow>Logged</Eyebrow>
          {log.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, fontSize: 15 }}>{e.name}</div>
              <div style={{ color: C.muted, fontSize: 14, marginRight: 10, fontVariantNumeric: "tabular-nums" }}>
                {e.cal} cal · {e.protein}g
              </div>
              <X size={16} color={C.muted} style={{ cursor: "pointer" }} onClick={() => removeEntry(e.id)} />
            </div>
          ))}
        </Card>
      )}

      <Card>
        <Eyebrow>Meal bank — tap to add</Eyebrow>
        {data.meals.length === 0 && (
          <div style={{ color: C.muted, fontSize: 14 }}>
            Empty. Log a meal below with "save to bank" on — since you eat the same meals daily, one setup week makes logging a 5-second job.
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.meals.map((m) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 6, background: C.card2,
              border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 12px", fontSize: 14, cursor: "pointer",
            }}>
              <span onClick={() => addEntry({ ...m, id: Date.now() })}>
                {m.name} <span style={{ color: C.muted }}>{m.cal}</span>
              </span>
              <X size={13} color={C.muted} onClick={() => removeMeal(m.id)} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Eyebrow>Add meal</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Input placeholder="Name (e.g., Breakfast — eggs + oatmeal)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input placeholder="Calories" type="number" inputMode="numeric" value={form.cal}
              onChange={(e) => setForm({ ...form, cal: e.target.value })} />
            <Input placeholder="Protein (g)" type="number" inputMode="numeric" value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.muted }}>
            <input type="checkbox" checked={form.save} onChange={(e) => setForm({ ...form, save: e.target.checked })} />
            Save to meal bank
          </label>
          <Btn onClick={addCustom}><Plus size={15} /> Log it</Btn>
        </div>
      </Card>
    </div>
  );
}

function TrainTab({ data, mutate, date }) {
  const [tpl, setTpl] = useState("Upper");
  const [inputs, setInputs] = useState({});
  const [chartEx, setChartEx] = useState(null);
  const [extra, setExtra] = useState("");
  const t = date;

  const lastSession = (ex) => {
    const prior = (data.lifts[ex] || []).filter((s) => s.date < t);
    if (!prior.length) return null;
    const ld = prior.reduce((m, s) => (s.date > m ? s.date : m), prior[0].date);
    return { date: ld, sets: prior.filter((s) => s.date === ld) };
  };
  const logSet = (ex) => {
    const v = inputs[ex] || {};
    if (!v.reps) return;
    mutate((d) => {
      const h = [...(d.lifts[ex] || [])];
      h.push({ date: t, weight: Number(v.weight) || 0, reps: Number(v.reps) });
      h.sort((a, b) => a.date.localeCompare(b.date));
      d.lifts = { ...d.lifts, [ex]: h };
    });
  };
  const removeSet = (ex, idx) =>
    mutate((d) => {
      d.lifts = { ...d.lifts, [ex]: (d.lifts[ex] || []).filter((_, i) => i !== idx) };
    });

  const allEx = Object.keys(data.lifts).filter((k) => (data.lifts[k] || []).length > 0);
  const chartData = useMemo(() => {
    if (!chartEx) return [];
    const h = data.lifts[chartEx] || [];
    const byDate = {};
    h.forEach((s) => {
      const cur = byDate[s.date];
      if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps)) byDate[s.date] = s;
    });
    return Object.keys(byDate).sort().map((d) => ({
      date: fmtDate(d), weight: byDate[d].weight, reps: byDate[d].reps,
      sets: h.filter((x) => x.date === d).length,
    }));
  }, [chartEx, data.lifts]);

  const exList = [...TEMPLATES[tpl]];
  const set = (ex, field, val) => setInputs({ ...inputs, [ex]: { ...(inputs[ex] || {}), [field]: val } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.keys(TEMPLATES).map((k) => (
          <div key={k} onClick={() => setTpl(k)} style={{
            padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: tpl === k ? C.accent : C.card,
            color: tpl === k ? "#14171C" : C.muted,
            border: `1px solid ${tpl === k ? C.accent : C.border}`,
          }}>{k}</div>
        ))}
      </div>

      <Card>
        <Eyebrow>{tpl} — log sets</Eyebrow>
        {exList.map((ex) => {
          const last = lastSession(ex);
          const v = inputs[ex] || {};
          const todays = (data.lifts[ex] || []).map((s2, i) => ({ ...s2, _i: i })).filter((s2) => s2.date === t);
          return (
            <div key={ex} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{ex}</span>
                <span style={{ color: C.muted, fontSize: 12, textAlign: "right" }}>
                  {last
                    ? `${fmtDate(last.date)}: ${last.sets.map((s2) => (s2.weight ? `${s2.weight}×${s2.reps}` : `${s2.reps}r`)).join(" · ")}`
                    : "no history"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                <Input placeholder="lbs" type="number" inputMode="numeric" value={v.weight || ""}
                  onChange={(e) => set(ex, "weight", e.target.value)} />
                <Input placeholder="reps" type="number" inputMode="numeric" value={v.reps || ""}
                  onChange={(e) => set(ex, "reps", e.target.value)} />
                <Btn small onClick={() => logSet(ex)} disabled={!v.reps}>Log set</Btn>
              </div>
              {todays.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {todays.map((s2, n) => (
                    <div key={s2._i} style={{
                      display: "flex", alignItems: "center", gap: 6, background: C.card2,
                      border: `1px solid ${C.border}`, borderRadius: 16, padding: "4px 10px", fontSize: 13,
                    }}>
                      <span style={{ color: C.muted, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>S{n + 1}</span>
                      <span>{s2.weight ? `${s2.weight}×${s2.reps}` : `${s2.reps} reps`}</span>
                      <X size={13} color={C.muted} style={{ cursor: "pointer" }} onClick={() => removeSet(ex, s2._i)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 }}>
          <Input placeholder="Ad-hoc exercise name" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <Btn small kind="ghost" disabled={!extra} onClick={() => {
            if (!extra) return;
            TEMPLATES[tpl].push(extra);
            setExtra("");
          }}><Plus size={14} /> Add</Btn>
        </div>
      </Card>

      {allEx.length > 0 && (
        <Card>
          <Eyebrow>Progression</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {allEx.map((ex) => (
              <div key={ex} onClick={() => setChartEx(ex)} style={{
                padding: "5px 10px", borderRadius: 16, fontSize: 13, cursor: "pointer",
                background: chartEx === ex ? C.card2 : "transparent",
                border: `1px solid ${chartEx === ex ? C.accent : C.border}`,
                color: chartEx === ex ? C.text : C.muted,
              }}>{ex}</div>
            ))}
          </div>
          {chartEx && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={C.muted} fontSize={11} />
                <YAxis stroke={C.muted} fontSize={11} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8 }}
                  labelStyle={{ color: C.muted }} formatter={(val, name, p) => [`${val} lb × ${p.payload.reps} · ${p.payload.sets} sets`, "top set"]} />
                <Line type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {chartEx && chartData.length === 0 && <div style={{ color: C.muted, fontSize: 14 }}>No sets logged yet.</div>}
        </Card>
      )}
    </div>
  );
}

function BodyTab({ data, mutate, date }) {
  const [w, setW] = useState("");
  const [waist, setWaist] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const s = data.settings;
  const sorted = useMemo(() => [...data.weighIns].sort((a, b) => a.date.localeCompare(b.date)), [data.weighIns]);
  const latest = sorted[sorted.length - 1];
  const latestWaist = [...sorted].reverse().find((x) => x.waist != null);

  const logWeighIn = () => {
    if (!w) return;
    mutate((d) => {
      const entry = { date, weight: Number(w) };
      if (waist) entry.waist = Number(waist);
      d.weighIns = [...d.weighIns.filter((x) => x.date !== date), entry];
    });
    setW(""); setWaist("");
  };

  const pace = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 21);
    const ck = cutoff.toLocaleDateString("en-CA");
    const recent = sorted.filter((x) => x.date >= ck);
    if (recent.length < 2) return null;
    const first = recent[0], last = recent[recent.length - 1];
    const days = (new Date(last.date) - new Date(first.date)) / 86400000;
    if (days < 7) return null;
    return ((last.weight - first.weight) / days) * 7;
  }, [sorted]);

  const chartData = sorted.map((x) => ({ date: fmtDate(x.date), weight: x.weight }));

  const updateSetting = (key, val) =>
    mutate((d) => { d.settings = { ...d.settings, [key]: Number(val) || d.settings[key] }; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card><Eyebrow>Start</Eyebrow><Big>{s.startWeight}</Big></Card>
        <Card><Eyebrow>Current</Eyebrow><Big color={C.accent}>{latest?.weight ?? "—"}</Big></Card>
        <Card><Eyebrow>Goal</Eyebrow><Big color={C.green}>{s.goalWeight}</Big></Card>
      </div>

      <Card>
        <Eyebrow>Weight trend</Eyebrow>
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={C.muted} fontSize={11} />
              <YAxis stroke={C.muted} fontSize={11} domain={[s.goalWeight - 2, "auto"]} />
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: C.muted }} />
              <ReferenceLine y={s.goalWeight} stroke={C.green} strokeDasharray="5 4"
                label={{ value: "goal", fill: C.green, fontSize: 11, position: "insideBottomRight" }} />
              <Line type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: C.muted, fontSize: 14 }}>Two or more weigh-ins draw the trend. You weigh 3x/week — chart fills in fast.</div>
        )}
        <div style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 13, color: C.muted, flexWrap: "wrap" }}>
          <span>Pace: <b style={{ color: pace == null ? C.muted : pace <= -0.3 && pace >= -1 ? C.green : C.yellow }}>
            {pace == null ? "needs ~2 wks of data" : `${pace > 0 ? "+" : ""}${pace.toFixed(1)} lb/wk`}</b></span>
          <span>Waist: <b style={{ color: C.text }}>{latestWaist ? `${latestWaist.waist}"` : "—"}</b> → {s.goalWaist}"</span>
        </div>
      </Card>

      <Card>
        <Eyebrow>Log weigh-in</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <Input placeholder="Weight (lb)" type="number" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
          <Input placeholder={'Waist (")'} type="number" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
          <Btn onClick={logWeighIn} disabled={!w}>Log</Btn>
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Same conditions each time: morning, post-bathroom, pre-food. Trend beats any single number.</div>
      </Card>

      <Card>
        <div onClick={() => setShowSettings(!showSettings)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Settings size={15} color={C.muted} />
          <span style={{ color: C.muted, fontSize: 14 }}>Targets</span>
        </div>
        {showSettings && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            {[["weekdayTarget", "Weekday cals (Mon–Thu)"], ["fridayTarget", "Friday cals"], ["weekendTarget", "Weekend cals (Sat–Sun)"], ["proteinTarget", "Protein (g)"], ["goalWeight", "Goal weight"], ["goalWaist", "Goal waist"]].map(([k, label]) => (
              <div key={k}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{label}</div>
                <Input type="number" inputMode="decimal" defaultValue={s[k]} onBlur={(e) => updateSetting(k, e.target.value)} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- app ---------- */
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [saveError, setSaveError] = useState("");
  const [activeDate, setActiveDate] = useState(todayKey());
  const savedTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => {
        if (!d.settings.fridayTarget) d.settings.fridayTarget = 2100;
        if (!d.settings.weekdayTarget) d.settings.weekdayTarget = 1900;
        if (!d.sports) d.sports = {};
        setData(d);
      })
      .catch(() => setData(seed()));
  }, []);

  const mutate = (fn) => {
    const next = { ...data };
    fn(next);
    setData(next);
    setSaveState("saving");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        console.error('Save failed — server response:', r.status, body);
        throw new Error(body.error || body.detail || `HTTP ${r.status}`);
      }
      setSaveState("saved");
      savedTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    }).catch((err) => {
      console.error('Save error:', err.message);
      setSaveError(err.message);
      setSaveState("error");
    });
  };

  if (!data) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "'Archivo', sans-serif" }}>
      Loading…
    </div>
  );

  const TABS = [
    { id: "dash", label: "Dash", icon: LayoutDashboard, el: <DashTab data={data} /> },
    { id: "today", label: "Today", icon: ClipboardCheck, el: <TodayTab data={data} mutate={mutate} date={activeDate} /> },
    { id: "food", label: "Food", icon: Utensils, el: <FoodTab data={data} mutate={mutate} date={activeDate} /> },
    { id: "train", label: "Train", icon: Dumbbell, el: <TrainTab data={data} mutate={mutate} date={activeDate} /> },
    { id: "sport", label: "Sport", icon: Trophy, el: <SportTab data={data} mutate={mutate} date={activeDate} /> },
    { id: "body", label: "Body", icon: TrendingUp, el: <BodyTab data={data} mutate={mutate} date={activeDate} /> },
  ];
  const active = TABS.find((x) => x.id === tab);

  const exportData = () => {
    const a = document.createElement("a");
    a.href = `/api/export`;
    a.download = `fitlog-export-${todayKey()}.json`;
    a.click();
  };

  const activeLabel = new Date(activeDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const backdating = activeDate !== todayKey();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Archivo', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Archivo:wght@400;500;600;700&display=swap');
        input::placeholder { color: #5C6675; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 14px 88px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26,
              letterSpacing: "0.02em", textTransform: "uppercase",
            }}>
              Fit<span style={{ color: C.accent }}>Log</span>
            </div>
            {saveState === "saving" && (
              <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Archivo', sans-serif" }}>Saving…</span>
            )}
            {saveState === "saved" && (
              <span style={{ fontSize: 12, color: C.green, fontFamily: "'Archivo', sans-serif", fontWeight: 600 }}>✓ Saved</span>
            )}
            {saveState === "error" && (
              <span onClick={() => setSaveState("idle")} style={{ fontSize: 12, color: C.red, fontFamily: "'Archivo', sans-serif", fontWeight: 600, cursor: "pointer" }} title={saveError}>✕ Save failed{saveError ? ` — ${saveError}` : ""}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div onClick={exportData} title="Export all data from database" style={{
              cursor: "pointer", color: C.muted, padding: "6px", borderRadius: 8,
              border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
              background: C.card,
            }}><Download size={16} /></div>
            <input type="date" value={activeDate} max={todayKey()}
              onChange={(e) => e.target.value && setActiveDate(e.target.value)}
              style={{
                background: C.card, border: `1px solid ${backdating ? C.yellow : C.border}`,
                color: C.text, borderRadius: 8, padding: "6px 8px", fontSize: 13,
                fontFamily: "'Archivo', sans-serif", colorScheme: "dark",
              }} />
          </div>
        </div>
        {backdating && (
          <div style={{
            background: "#39331F", border: `1px solid ${C.yellow}`, borderRadius: 8,
            padding: "8px 12px", fontSize: 13, marginBottom: 12, color: "#EBDCA8",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Logging to <b>{activeLabel}</b></span>
            <span onClick={() => setActiveDate(todayKey())}
              style={{ color: C.yellow, fontWeight: 600, cursor: "pointer" }}>Back to today</span>
          </div>
        )}
        {active.el}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: C.card,
        borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around",
        padding: "8px 0 14px",
      }}>
        {TABS.map((x) => {
          const Icon = x.icon;
          const on = tab === x.id;
          return (
            <div key={x.id} onClick={() => setTab(x.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              cursor: "pointer", color: on ? C.accent : C.muted, minWidth: 50,
            }}>
              <Icon size={21} strokeWidth={on ? 2.4 : 1.8} />
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>{x.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
