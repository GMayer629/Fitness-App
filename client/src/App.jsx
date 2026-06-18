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
  dailyRatings: {},
  liftNotes: {},
  injuries: [],
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

const Textarea = (props) => (
  <textarea {...props} style={{
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "9px 10px", fontSize: 14, fontFamily: "'Archivo', sans-serif",
    width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 60,
    ...props.style,
  }} />
);

const ratingColor = (n) => n >= 8 ? C.green : n >= 5 ? C.yellow : C.red;

const RatingPicker = ({ value, onChange, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
    <span style={{ color: C.muted, fontSize: 13, width: 52, flexShrink: 0 }}>{label}</span>
    <div style={{ display: "flex", gap: 4, flex: 1 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <div key={n} onClick={() => onChange(n === value ? null : n)} style={{
            flex: 1, height: 28, borderRadius: 5, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: active ? ratingColor(n) : C.card2,
            color: active ? "#14171C" : n <= (value || 0) ? ratingColor(n) : C.muted,
            border: `1px solid ${active ? ratingColor(n) : C.border}`,
            transition: "background 0.1s",
          }}>{n}</div>
        );
      })}
    </div>
  </div>
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

  const weeks = [];
  for (let o = 3; o >= 0; o--) {
    const m = new Date();
    m.setDate(m.getDate() - (m.getDay() + 6) % 7 - o * 7);
    let total = 0, logged = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(m);
      d.setDate(m.getDate() + i);
      const dk = d.toLocaleDateString("en-CA");
      if (dk > todayKey()) break;
      total++;
      if ((data.foodLog[dk] || []).length > 0) logged++;
    }
    weeks.push({ label: `wk of ${fmtDate(m.toLocaleDateString("en-CA"))}`, total, logged, current: o === 0 });
  }
  const weightSeries = sorted.map((x) => ({ v: x.weight }));

  const wk = currentWeekDates();
  const liftDays = wk.filter((d) =>
    d <= todayKey() && Object.values(data.lifts || {}).some((arr) => arr.some((s) => s.date === d))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <Big>{latestWaist?.waist ?? "—"}</Big>
            <Delta value={waistDelta} goodWhenDown unit='"' />
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>goal {s.goalWaist}"</div>
        </Card>
      </div>
      <Card>
        <Eyebrow>Lift highlights</Eyebrow>
        {KEY_LIFTS.map((ex) => {
          const st = liftStat(ex);
          if (!st) return <div key={ex} style={{ color: C.muted, fontSize: 14, padding: "4px 0" }}>{ex}: no data</div>;
          return (
            <div key={ex} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{ex}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Spark series={st.series} color={C.accent} />
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{st.label}</span>
                <Delta value={st.delta} unit={st.unit} />
              </div>
            </div>
          );
        })}
      </Card>
      <Card>
        <Eyebrow>Food log streak</Eyebrow>
        <div style={{ display: "flex", gap: 8 }}>
          {weeks.map((w) => (
            <div key={w.label} style={{
              flex: 1, background: C.card2, border: `1px solid ${w.current ? C.accent : C.border}`,
              borderRadius: 8, padding: "8px 6px", textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{w.label}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: w.logged === w.total ? C.green : C.text }}>{w.logged}/{w.total}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Eyebrow>Lift days this week</Eyebrow>
        <Big color={liftDays.length >= 3 ? C.green : C.text}>{liftDays.length}</Big>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>days with sets logged · target 3</div>
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
  const [sportNote, setSportNote] = useState("");

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
    if (sportNote.trim()) e.notes = sportNote.trim();
    mutate((d) => { d.sports = { ...(d.sports || {}), [t]: [...((d.sports || {})[t] || []), e] }; });
    setMins(""); setWalked(""); setCart(""); setCustom(""); setSportNote("");
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
          <Textarea placeholder="Notes (optional — course conditions, how you played, felt...)"
            value={sportNote} onChange={(e) => setSportNote(e.target.value)} style={{ minHeight: 48 }} />
        </div>
      </Card>

      <Card>
        <Eyebrow>This week</Eyebrow>
        {weekEntries.length === 0 && <div style={{ color: C.muted, fontSize: 14 }}>Nothing logged yet this week.</div>}
        {weekEntries.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{e.activity}</span>
              <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>{describe(e)}</span>
              {e.notes && <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{e.notes}</div>}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginRight: 10, flexShrink: 0 }}>{fmtDate(e.date)}</div>
            {e.date === t && <X size={15} color={C.muted} style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />}
          </div>
        ))}
      </Card>
    </div>
  );
}
