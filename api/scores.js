export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const dates = req.query.dates || '20260319-20260408';

  const ESPN_URL =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/` +
    `mens-college-basketball/scoreboard?dates=${dates}&limit=200`;

  try {
    const espnRes = await fetch(ESPN_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });

    if (!espnRes.ok) {
      return res.status(502).json({ error: `ESPN returned ${espnRes.status}` });
    }

    const raw = await espnRes.text(); // text first so we can debug if JSON parse fails
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({ error: 'ESPN returned non-JSON', preview: raw.slice(0, 200) });
    }

    const events = data.events || [];
    const games = events.map((event) => {
      const comp = (event.competitions || [])[0] || {};
      const competitors = comp.competitors || [];
      const home = competitors.find((c) => c.homeAway === 'home') || {};
      const away = competitors.find((c) => c.homeAway === 'away') || {};
      const statusName = (comp.status && comp.status.type && comp.status.type.name) || 'STATUS_SCHEDULED';

      return {
        id: event.id,
        status: statusName,
        start_time: event.date,
        home: {
          name: (home.team && (home.team.shortDisplayName || home.team.displayName)) || '',
          score: parseInt(home.score) || 0,
        },
        away: {
          name: (away.team && (away.team.shortDisplayName || away.team.displayName)) || '',
          score: parseInt(away.score) || 0,
        },
      };
    });

    return res.status(200).json({ games, _total: games.length, _dates: dates });

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
