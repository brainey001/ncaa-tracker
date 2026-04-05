export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
try {
const today = new Date();
const yyyy = today.getUTCFullYear();
const mm = String(today.getUTCMonth() + 1).padStart(2, ‘0’);
const dd = String(today.getUTCDate()).padStart(2, ‘0’);
const dateStr = yyyy + mm + dd;

```
// groups=100 = NCAA tournament, groups=50 = general/conference tournaments
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&groups=100';
const TODAY = BASE + '&dates=' + dateStr;

const [r1, r2] = await Promise.allSettled([fetch(BASE), fetch(TODAY)]);

const seen = new Set();
const games = [];

for (const result of [r1, r2]) {
  if (result.status !== 'fulfilled' || !result.value.ok) continue;
  let d;
  try { d = await result.value.json(); } catch(e) { continue; }
  for (const ev of (d.events || [])) {
    try {
      if (!ev || !ev.id || seen.has(ev.id)) continue;
      seen.add(ev.id);
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
    } catch(e) { continue; }
  }
}

res.json({ games, _total: games.length });
```

} catch(e) {
res.status(500).json({ error: e.message });
}
}
