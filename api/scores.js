export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const r = await fetch("https://ncaa-api.henrygd.me/brackets/basketball-men/d1/2026");
    const d = await r.json();
    const games = [];
    const rounds = d.bracket?.rounds || [];
    for (const round of rounds) {
      for (const game of (round.games || [])) {
        if (!game.top?.names?.short || !game.bottom?.names?.short) continue;
        games.push({
          id: game.gameId || (game.top.names.short + game.bottom.names.short),
          status: game.gameState === "F" ? "STATUS_FINAL" : game.gameState === "L" ? "STATUS_IN_PROGRESS" : "STATUS_SCHEDULED",
          home: { name: game.top.names.short, score: parseInt(game.top.score) || 0 },
          away: { name: game.bottom.names.short, score: parseInt(game.bottom.score) || 0 },
          start_time: game.startDate || "",
          round: round.roundNumber
        });
      }
    }
    res.json({ games, _total: games.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
