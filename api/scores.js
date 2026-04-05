export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const r = await fetch("https://ncaa-api.henrygd.me/brackets/basketball-men/d1/2026");
    const d = await r.json();

    const championship = d.championships?.[0];
    if (!championship) return res.status(500).json({ error: "No championship data" });

    // Build a round lookup: bracketPositionId range → roundNumber
    // Positions 101-104 = round 1, 201-232 = round 2, 301-316 = round 3, etc.
    const roundMap = {
      1: [100, 199],
      2: [200, 299],
      3: [300, 399],
      4: [400, 499],
      5: [500, 599],
      6: [600, 699],
      7: [700, 799],
    };

    const getRound = (bracketPositionId) => {
      for (const [round, [min, max]] of Object.entries(roundMap)) {
        if (bracketPositionId >= min && bracketPositionId <= max) return parseInt(round);
      }
      return 0;
    };

    const games = [];
    for (const game of (championship.games || [])) {
      const top = game.teams?.find(t => t.isTop);
      const bottom = game.teams?.find(t => !t.isTop);
      if (!top?.nameShort || !bottom?.nameShort) continue;

      games.push({
        id: game.contestId?.toString() || `${top.nameShort}${bottom.nameShort}`,
        status: game.gameState === "F" ? "STATUS_FINAL"
              : game.gameState === "I" ? "STATUS_IN_PROGRESS"
              : "STATUS_SCHEDULED",
        home: { name: top.nameShort, score: top.score ?? 0, seed: top.seed, winner: top.isWinner },
        away: { name: bottom.nameShort, score: bottom.score ?? 0, seed: bottom.seed, winner: bottom.isWinner },
        start_time: game.startDate || "",
        round: getRound(game.bracketPositionId),
        period: game.currentPeriod || "",
        clock: game.contestClock || "",
        broadcaster: game.broadcaster?.name || "",
      });
    }

    res.json({ games, _total: games.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
