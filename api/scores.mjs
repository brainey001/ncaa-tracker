export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
try {
const ESPN = ‘https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&groups=50’;
const r = await fetch(ESPN);
const d = await r.json();
const games = (d.events || []).map(ev => {
const c = ev.competitions[0];
const home = c.competitors.find(x => x.homeAway === ‘home’);
const away = c.competitors.find(x => x.homeAway === ‘away’);
return {
id: ev.id,
status: c.status.type.name,
home: { name: home.team.shortDisplayName, score: parseInt(home.score) || 0 },
away: { name: away.team.shortDisplayName, score: parseInt(away.score) || 0 },
start_time: ev.date,
};
});
res.json({ games });
} catch(e) {
res.status(500).json({ error: e.message });
}
}
