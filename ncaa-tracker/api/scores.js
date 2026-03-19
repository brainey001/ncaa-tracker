// /api/scores.js  — Vercel serverless function
export default async function handler(req, res) {
  // ESPN's unofficial API — free, no key required
  const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
  
  const response = await fetch(const r = await fetch('https://project-r4phb.vercel.app/api/scores');
  const data = await response.json();

  const games = data.events.map(event => {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    return {
      id: event.id,
      status: comp.status.type.name,        // "STATUS_FINAL", "STATUS_IN_PROGRESS", etc.
      home: { name: home.team.shortDisplayName, score: home.score },
      away: { name: away.team.shortDisplayName, score: away.score },
      start_time: event.date,
    };
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ games });
}