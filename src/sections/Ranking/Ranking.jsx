import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase.js";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import "./Ranking.css";

// Constants
const RANK_COLORS = {
    1: "rank-gold",
    2: "rank-silver",
    3: "rank-bronze",
    default: "rank-default",
};

const STATS_CONFIG = [
    { label: "Winrate", field: "winrate", editable: false, format: (val) => `${val}%` },
    { label: "Matches", field: "matches", editable: false },
    { label: "Wins", field: "wins", editable: true },
    { label: "Losses", field: "losses", editable: true },
    { label: "Draws", field: "draws", editable: true },
    { label: "Bonus 5 Goal", field: "bonus5goal", editable: true },
];

// Stats
const calculateStats = (wins = 0, draws = 0, losses = 0, bonus5goal = 0) => {
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

// UI helpers
const getRankColor = (rank) => RANK_COLORS[rank] || RANK_COLORS.default;

// Loading / empty
const LoadingState = () => (
    <div className="ranking-container">
        <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading rankings...</p>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="ranking-container">
        <div className="empty-state">
            <p>No players found for this season.</p>
        </div>
    </div>
);

const RankBadge = ({ rank }) => (
    <div className="rank-badge">
        <span className="rank-number">{rank}</span>
    </div>
);

const PlayerInfo = ({ name }) => (
    <div className="player-info">
        <h3 className="player-name">{name}</h3>
    </div>
);

// Fame rolling text
const FameDisplay = ({ playerId, fame, currentUser, onUpdate }) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const overflow = textRef.current.scrollWidth > containerRef.current.offsetWidth;
                setIsOverflowing(overflow);

                if (overflow) {
                    textRef.current.style.setProperty(
                        "--container-width",
                        `${containerRef.current.offsetWidth}px`
                    );
                }
            }
        };

        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [fame]);

    return (
        <div className="player-fame-container" ref={containerRef}>
            {currentUser ? (
                <input
                    type="text"
                    className="player-fame fame-input"
                    value={fame || ""}
                    onChange={(e) => onUpdate(playerId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter fame..."
                />
            ) : (
                fame && (
                    <p ref={textRef} className={`player-fame ${isOverflowing ? "scrolling" : ""}`}>
                        {fame}
                    </p>
                )
            )}
        </div>
    );
};

// Points + value
const PlayerPoints = ({ points, value, rank }) => {
    const colorClass = getRankColor(rank);

    return (
        <div className="player-points">
            <div className="points-group">
                <span className={`points-value ${colorClass}`}>
                    {Math.round(points || 0)}
                </span>
                <span className="points-label">Points</span>
            </div>

            <div className="value-group">
                <span className={`points-value ${colorClass}`}>{Number(value).toFixed(2)}</span>
                <span className="points-label">Value</span>
            </div>
        </div>
    );
};

// + / -
const StatControls = ({ onIncrement, onDecrement }) => (
    <div className="stat-controls" onClick={(e) => e.stopPropagation()}>
        <button className="stat-btn stat-btn-minus" onClick={onDecrement}>
            −
        </button>
        <button className="stat-btn stat-btn-plus" onClick={onIncrement}>
            +
        </button>
    </div>
);

// Stat item
const StatItem = ({ label, value, editable, currentUser, onUpdate, format }) => (
    <div className="stat-item">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
            <span className="stat-value">{format ? format(value) : value}</span>
            {currentUser && editable && (
                <StatControls onIncrement={() => onUpdate(1)} onDecrement={() => onUpdate(-1)} />
            )}
        </div>
    </div>
);

// Player expanded details
const PlayerDetails = ({ player, currentUser, onUpdateField }) => (
    <div className="ranking-item-details">
        <div className="stats-grid">
            {STATS_CONFIG.map(({ label, field, editable, format }) => (
                <StatItem
                    key={field}
                    label={label}
                    value={field === "value" ? Number(player.value).toFixed(2) : player[field] || 0}
                    editable={editable}
                    currentUser={currentUser}
                    onUpdate={(delta) => onUpdateField(player.id, field, delta)}
                    format={format}
                />
            ))}
        </div>
    </div>
);

const RankingItem = ({
                         player,
                         rank,
                         isExpanded,
                         onToggle,
                         currentUser,
                         onUpdateField,
                         onUpdateFame,
                     }) => {
    const handleClick = (e) => {
        if (!e.target.closest(".stat-controls") && !e.target.closest(".fame-input")) {
            onToggle(player.id);
        }
    };

    return (
        <div className={`ranking-item ${getRankColor(rank)} ${isExpanded ? "expanded" : ""}`} onClick={handleClick}>
            <div className="ranking-item-main">
                <RankBadge rank={rank} />
                <PlayerInfo name={player.name} />
                <FameDisplay playerId={player.id} fame={player.fame} currentUser={currentUser} onUpdate={onUpdateFame} />
                <PlayerPoints points={player.points} value={player.value} rank={rank} />
            </div>

            {isExpanded && (
                <PlayerDetails player={player} currentUser={currentUser} onUpdateField={onUpdateField} />
            )}
        </div>
    );
};

// MAIN COMPONENT
function Ranking() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlayer, setExpandedPlayer] = useState(null);

    // Fetch players
    useEffect(() => {
        if (!selectedSeason) return;

        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));

                const list = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => {
                        // Step 1: non-zero matches first
                        if ((a.matches || 0) === 0 && (b.matches || 0) > 0) return 1;
                        if ((b.matches || 0) === 0 && (a.matches || 0) > 0) return -1;

                        // Step 2: points desc
                        if ((b.points || 0) !== (a.points || 0)) return b.points - a.points;

                        // Step 3: fewer matches first
                        if ((a.matches || 0) !== (b.matches || 0)) return a.matches - b.matches;

                        // Step 4: value desc
                        return (b.value || 0) - (a.value || 0);
                    });

                setPlayers(list);
                setExpandedPlayer(null);
            } catch (error) {
                console.error("Error loading players:", error);
            }

            setLoading(false);
        };

        fetchPlayers();
    }, [selectedSeason]);

    // Update a player stat
    const updatePlayerField = useCallback(
        async (playerId, field, delta) => {
            const player = players.find((p) => p.id === playerId);
            if (!player) return;

            const newValue = Math.max(0, (player[field] || 0) + delta);

            const updatedPlayer = { ...player, [field]: newValue };

            const stats = calculateStats(
                updatedPlayer.wins,
                updatedPlayer.draws,
                updatedPlayer.losses,
                updatedPlayer.bonus5goal
            );

            // Update local ranking with correct ordering
            setPlayers((prev) =>
                prev
                    .map((p) =>
                        p.id === playerId
                            ? { ...p, [field]: newValue, ...stats }
                            : p
                    )
                    .sort((a, b) => {
                        if ((a.matches || 0) === 0 && (b.matches || 0) > 0) return 1;
                        if ((b.matches || 0) === 0 && (a.matches || 0) > 0) return -1;

                        if ((b.points || 0) !== (a.points || 0)) return b.points - a.points;

                        if ((a.matches || 0) !== (b.matches || 0)) return a.matches - b.matches;

                        return (b.value || 0) - (a.value || 0);
                    })
            );

            // Firestore update
            try {
                await updateDoc(doc(db, `seasons/${selectedSeason}/players/${playerId}`), {
                    [field]: newValue,
                    ...stats,
                    value: Number(stats.value),
                });
            } catch (error) {
                console.error("Error updating player:", error);
            }
        },
        [players, selectedSeason]
    );

    // Fame update
    const updatePlayerFame = useCallback(
        async (playerId, newFame) => {
            setPlayers((prev) =>
                prev.map((p) => (p.id === playerId ? { ...p, fame: newFame } : p))
            );

            try {
                await updateDoc(doc(db, `seasons/${selectedSeason}/players/${playerId}`), {
                    fame: newFame,
                });
            } catch (error) {
                console.error("Error updating fame:", error);
            }
        },
        [selectedSeason]
    );

    // expand/collapse
    const togglePlayerExpansion = useCallback(
        (playerId) => {
            setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
        },
        []
    );

    if (loading) return <LoadingState />;
    if (players.length === 0) return <EmptyState />;

    // Dense ranking generation
    const ranks = [];
    let currentRank = 1;
    let uniqueRankCount = 0;

    players.forEach((player, i) => {
        if (
            i > 0 &&
            players[i - 1].matches > 0 &&
            player.points === players[i - 1].points &&
            player.matches === players[i - 1].matches &&
            player.value === players[i - 1].value
        ) {
            ranks.push(currentRank);
        } else if (player.matches > 0) {
            currentRank = uniqueRankCount + 1;
            ranks.push(currentRank);
            uniqueRankCount++;
        } else {
            ranks.push(null);
        }
    });

    const lastRank = Math.max(...ranks.filter((r) => r !== null));
    const zeroMatchStart = lastRank + 1;

    ranks.forEach((r, i) => {
        if (r === null) ranks[i] = zeroMatchStart;
    });

    return (
        <div className="ranking-container">
            <h1 className="section-title">FootballSanci</h1>

            <div className="ranking-list">
                {players.map((player, i) => (
                    <RankingItem
                        key={player.id}
                        player={player}
                        rank={ranks[i]}
                        isExpanded={expandedPlayer === player.id}
                        onToggle={togglePlayerExpansion}
                        currentUser={currentUser}
                        onUpdateField={updatePlayerField}
                        onUpdateFame={updatePlayerFame}
                    />
                ))}
            </div>
        </div>
    );
}

export default Ranking;