// Fonction partagée entre Draw & Ranking
export const calculateStats = (wins = 0, draws = 0, losses = 0, bonus5goal = 0) => {
    const matches = wins + draws + losses;

    const winrate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : 0;

    const points = wins * 3 + draws + bonus5goal;

    const rawValue =
        matches > 0
            ? 10 *
            (0.9 * ((3 * wins + draws) / (3 * matches)) +
                0.1 * Math.min(bonus5goal / matches, 1))
            : 0;

    const value = Number(rawValue.toFixed(2));

    return {
        matches,
        winrate: parseFloat(winrate),
        points,
        value,
    };
};