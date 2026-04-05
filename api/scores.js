export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
try {
// Fetch both the general scoreboard AND today’s specific date
// ESPN’s scoreboard endpoint without a date returns ~current window
// Adding a date param forces it to return that day’s games
const today = new Date();
const yyyy = today.getUTCFullYear();
const mm = String(today.getUTCMonth() + 1).padStart(2, ‘0’);
const dd = String(today.getUTCDate()).padStart(2, ‘0’);
const dateStr = `${yyyy}${mm}${dd}`;

```
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

// Fetch general feed (gets historical completed games) + today's feed
const [r1, r2] = await Promise.all([
  fetch(`${BASE}?limit=100&groups=50`),
  fetch(`${BASE}?limit=100&groups=50&dates=${dateStr}`)
]);

const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

const allEvents = [...(d1.events || []), ...(d2.events || [])];

// Deduplicate by event id
const seen = new Set();
const events = allEvents.filter(ev => {
  if (seen.has(ev.id)) return false;
  seen.add(ev.id);
  return true;
});

const games = events.map(ev => {
  const c = ev.competitions[0];
  const home = c.competitors.find(x => x.homeAway === 'home');
  const away = c.competitors.find(x => x.homeAway === 'away');
  return {
    id: ev.id,
    status: c.status.type.name,
    home: { name: home.team.shortDisplayName, score: parseInt(home.score) || 0 },
    away: { name: away.team.shortDisplayName, score: parseInt(away.score) || 0 },
    start_time: ev.date,
  };
});

res.json({ games, _total: games.length });
```

} catch(e) {
res.status(500).json({ error: e.message });
}
}
