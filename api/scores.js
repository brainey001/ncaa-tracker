export default async function handler(req, res) {
  // Allow CORS so your index.html can call this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept a ?dates= param (e.g. "20260319" or "20260319-20260408")
  // Default to the full 2026 NCAA Tournament range
  const dates = req.query.dates || '20260319-20260408';

  const ESPN_URL =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard` +
    `?dates=${dates}&limit=200`;

  try {
    const espnRes = await fetch(ESPN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!espnRes.ok) {
      return res.status(espnRes.status).json({ error: `ESPN returned ${espnRes.status}` });
    }

    const data = await espnRes.json();

    // Normalize ESPN's response into your existing { games: [...] } shape
    const games = (data.events || []).map((event) => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');

      return {
        id: event.id,
        status: comp?.status?.type?.name || 'STATUS_SCHEDULED',
        start_time: event.date,
        home: {
          name: home?.team?.shortDisplayName || home?.team?.displayName || '',
          score: parseInt(home?.score) || 0,
        },
        away: {
          name: away?.team?.shortDisplayName || away?.team?.displayName || '',
          score: parseInt(away?.score) || 0,
        },
      };
    });

    return res.status(200).json({ games });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
