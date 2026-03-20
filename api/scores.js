export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // All NCAA Tournament dates 2026
  const DATES = [
    '20260319', '20260320', '20260321', '20260322', '20260323',
    '20260326', '20260327', '20260328', '20260329', '20260330',
    '20260402', '20260403', '20260405', '20260406', '20260408'
  ];

  const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';

  try {
    // Fetch all dates in parallel
    const responses = await Promise.all(
      DATES.map(d =>
        fetch(`${BASE}?dates=${d}&groups=100&limit=50`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        })
        .then(r => r.ok ? r.json() : { events: [] })
        .catch(() => ({ events: [] }))
      )
    );

    // Merge all events, deduplicate by id
    const seen = new Set();
    const allGames = [];

    for (const data of responses) {
      for (const event of (data.events || [])) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);

        const comp = (event.competitions || [])[0] || {};
        const competitors = comp.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home') || {};
        const away = competitors.find(c => c.homeAway === 'away') || {};
        const statusName = (comp.status && comp.status.type && comp.status.type.name) || 'STATUS_SCHEDULED';

        allGames.push({
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
        });
      }
    }

    return res.status(200).json({ games: allGames, _total: allGames.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
