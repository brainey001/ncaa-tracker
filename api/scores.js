module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘GET’);
try {
const today = new Date();
const yyyy = today.getUTCFullYear();
const mm = String(today.getUTCMonth() + 1).padStart(2, ‘0’);
const dd = String(today.getUTCDate()).padStart(2, ‘0’);
const dateStr = yyyy + mm + dd;
const url = ‘https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=100&dates=’ + dateStr;
const r = await fetch(url);
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
};
