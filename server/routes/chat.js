const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(context) {
  const { settings, recentWeighIns, recentFood, recentLifts, recentSports, injuries } = context;

  const weighStr = recentWeighIns.length
    ? recentWeighIns.map(w => `${w.date}: ${w.weight} lbs${w.waist ? `, waist ${w.waist}"` : ''}`).join('\n')
    : 'No recent weigh-ins';

  const foodStr = recentFood.length
    ? recentFood.map(f => `${f.date} — ${f.name} (${f.calories} cal, ${f.protein}g protein)`).join('\n')
    : 'No recent food log entries';

  const liftStr = recentLifts.length
    ? recentLifts.map(l => `${l.date} — ${l.exercise}: ${l.weight}lbs x ${l.reps} reps`).join('\n')
    : 'No recent lift history';

  const sportStr = recentSports.length
    ? recentSports.map(s => `${s.date} — ${s.activity} (${s.minutes} min${s.holes_walked ? `, ${s.holes_walked} holes walked` : ''})`).join('\n')
    : 'No recent sport sessions';

  const injuryStr = injuries.length
    ? injuries.map(i => `${i.date} — ${i.body_part} severity ${i.severity}/10${i.notes ? ': ' + i.notes : ''}`).join('\n')
    : 'No current injuries logged';

  return `You are a personal fitness coach for Greg, a 39-year-old male, 5'6", currently ~${recentWeighIns[0]?.weight || settings.startWeight} lbs.

## User Profile
- Age: 39, Height: 5'6"
- Sports: golf, basketball, paddle tennis
- Lifting: 3x/week (Upper/Legs/Arms rotation)
- Chronic issues: neck/trap tightness linked to thoracic spine stiffness
- Active injury/recovery: quad/knee issue (recovering)
- Primary goals: reach ${settings.goalWeight} lbs goal weight by ${settings.goalDate}, sub-15% body fat

## Current Settings
- Calorie targets: weekday ${settings.weekdayTarget} kcal, Friday ${settings.fridayTarget} kcal, weekend ${settings.weekendTarget} kcal
- Protein target: ${settings.proteinTarget}g/day
- Start weight: ${settings.startWeight} lbs, Goal weight: ${settings.goalWeight} lbs, Goal waist: ${settings.goalWaist}"

## Recent Weigh-ins
${weighStr}

## Recent Food Log (last 14 days)
${foodStr}

## Recent Lift History (last 14 days)
${liftStr}

## Recent Sport Sessions (last 14 days)
${sportStr}

## Injuries / Symptoms
${injuryStr}

## Your Role
- Give concise, practical advice tailored to Greg's profile
- Estimate calories/macros for meals he describes
- Recommend workouts that account for his injuries and sport schedule
- Reference his actual data when relevant
- Keep responses focused — bullet points when listing, prose for explanations
- Today's date is ${new Date().toLocaleDateString('en-CA')}`;
}

router.post('/', async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const systemPrompt = buildSystemPrompt(context || {
      settings: { weekdayTarget: 1900, fridayTarget: 2100, weekendTarget: 2450, proteinTarget: 150, startWeight: 175, goalWeight: 156, goalWaist: 30.5, goalDate: '2026-09-03' },
      recentWeighIns: [],
      recentFood: [],
      recentLifts: [],
      recentSports: [],
      injuries: [],
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content[0]?.text || '';
    res.json({ reply });
  } catch (err) {
    console.error('[POST /api/chat] error:', err.message);
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
