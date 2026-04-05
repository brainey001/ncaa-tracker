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

const safeJson = async (url) => {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return d.events || [];
  } catch(e) {
    return [];
  }
};

const [general, todayEvents] = await Promise.all([
  safeJson(BASE),
  safeJson(`${BASE}&dates=${dateStr}`)
]);

// Merge and deduplicate by event id
const seen = new Set();
const allEvents = [...general, ...todayEvents].filter(ev => {
  if (!ev || !ev.id) return false;
  if (seen.has(ev.id)) return false;
  seen.add(ev.id);
  return true;
});

const games = allEvents.map(ev => {
  try {
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
  } catch(e) {
    return null;
  }
}).filter(Boolean);

res.json({ games, _total: games.length });
```

} catch(e) {
res.status(500).json({ error: e.message });
}
}
