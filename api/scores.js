export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
try {
const today = new Date();
const yyyy = today.getUTCFullYear();
const mm = String(today.getUTCMonth() + 1).padStart(2, ‘0’);
const dd = String(today.getUTCDate()).padStart(2, ‘0’);
const dateStr = `${yyyy}${mm}${dd}`;

```
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&groups=50';

// Fetch general (historical) + today's date-specific feed
const [r1, r2] = await Promise.allSettled([
  fetch(BASE),
  fetch(`${BASE}&dates=${dateStr}`)
]);

const events = [];
const seen = new Set();

for (const result of [r1, r2]) {
  if (result.status !== 'fulfilled' || !result.value.ok) continue;
  const d = await result.value.json();
  for (const ev of (d.events || [])) {
    if (!ev || !ev.id || seen.has(ev.id)) continue;
    seen.add(ev.id);
    events.push(ev);
  }
}

const games = [];
for (const ev of events) {
  try {
    const c = ev.competitions[0];
    const home = c.competitors.find(x => x.homeAway === 'home');
    const away = c.competitors.find(x => x.homeAway === 'away');
    if (!home || !away) continue;
    games.push({
      id: ev.id,
      status: c.status.type.name,
      home: { name: home.team.shortDisplayName, score: parseInt(home.score) || 0 },
      away: { name: away.team.shortDisplayName, score: parseInt(away.score) || 0 },
      start_time: ev.date,
    });
  } catch(e) { /* skip malformed */ }
}

res.json({ games, _total: games.length });
```

} catch(e) {
res.status(500).json({ error: e.message });
}
}
