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
// Fetch two date windows and merge: the rolling general feed + today specifically
const urls = [
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&groups=50',
  `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&groups=50&dates=${dateStr}`
];

const responses = await Promise.allSettled(urls.map(u => fetch(u)));

const allEvents = [];
for (const result of responses) {
  if (result.status !== 'fulfilled') continue;
  const r = result.value;
  if (!r.ok) continue;
  const d = await r.json();
  if (d.events) allEvents.push(...d.events);
}

// Deduplicate by id
const seen = new Set();
const events = allEvents.filter(ev => {
  if (!ev || !ev.id || seen.has(ev.id)) return false;
  seen.add(ev.id);
  return true;
});

const games = [];
for (const ev of events) {
  try {
    const c = ev.competitions[0];
    const home = c.competitors.find(x => x.homeAway === 'home');
    const away = c.competitors.find(x => x.homeAway === 'away');
    games.push({
      id: ev.id,
      status: c.status.type.name,
      home: { name: home.team.shortDisplayName, score: parseInt(home.score) || 0 },
      away: { name: away.team.shortDisplayName, score: parseInt(away.score) || 0 },
      start_time: ev.date,
    });
  } catch(e) {
    // skip malformed events
  }
}

res.json({ games, _total: games.length });
```

} catch(e) {
res.status(500).json({ error: e.message });
}
}
