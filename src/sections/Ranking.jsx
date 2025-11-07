import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import { useAuth } from "../components/AuthContext.jsx";
import "./Ranking.css";

function Ranking() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlayer, setExpandedPlayer] = useState(null);

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));
                const list = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.value || 0) - (a.value || 0));
                setPlayers(list);
                setExpandedPlayer(null);
            } catch (e) {
                console.error("Error loading players:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const calculateStats = (wins, draws, losses, bonus5goal) => {
        const matches = (wins || 0) + (draws || 0) + (losses || 0);
        const winrate = matches > 0 ? ((wins || 0) / matches * 100).toFixed(1) : 0;
        const points = (wins || 0) * 3 + (draws || 0) + (bonus5goal || 0);
        const value = matches > 0
            ? (10 * (0.9 * ((3 * (wins || 0) + (draws || 0)) / (3 * matches)) + 0.1 * Math.min((bonus5goal || 0) / matches, 1))).toFixed(2)
            : 0;

        return { matches, winrate, points, value };
    };

    const updatePlayerField = async (playerId, field, delta) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        const newValue = Math.max(0, (player[field] || 0) + delta);

        const updatedPlayer = { ...player, [field]: newValue };
        const { matches, winrate, points, value } = calculateStats(
            updatedPlayer.wins,
            updatedPlayer.draws,
            updatedPlayer.losses,
            updatedPlayer.bonus5goal
        );

        setPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p.id === playerId
                    ? { ...p, [field]: newValue, matches, winrate, points, value: parseFloat(value) }
                    : p
            ).sort((a, b) => (b.points || 0) - (a.points || 0) || (b.value || 0) - (a.value || 0))
        );

        try {
            const playerRef = doc(db, `seasons/${selectedSeason}/players/${playerId}`);
            await updateDoc(playerRef, {
                [field]: newValue,
                matches,
                winrate: parseFloat(winrate),
                points,
                value: parseFloat(value)
            });
        } catch (error) {
            console.error("Error updating player:", error);
        }
    };

    const updatePlayerFame = async (playerId, newFame) => {
        setPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p.id === playerId ? { ...p, fame: newFame } : p
            )
        );

        try {
            const playerRef = doc(db, `seasons/${selectedSeason}/players/${playerId}`);
            await updateDoc(playerRef, { fame: newFame });
        } catch (error) {
            console.error("Error updating fame:", error);
        }
    };

    const formatStatValue = (label, value) => (label === "Winrate" ? `${value}%` : value);

    const getRankColor = (rank) => {
        if (rank === 1) return "rank-gold";
        if (rank === 2) return "rank-silver";
        if (rank === 3) return "rank-bronze";
        return "rank-default";
    };

    const getPointsColorClass = (rank) => {
        if (rank === 1) return "rank-gold";
        if (rank === 2) return "rank-silver";
        if (rank === 3) return "rank-bronze";
        return "";
    };

    const togglePlayerExpansion = (playerId) => {
        setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
    };

    if (loading) {
        return (
            <div className="ranking-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading rankings...</p>
                </div>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="ranking-container">
                <div className="empty-state">
                    <p>No players found for this season.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ranking-container">
            <h1 className="section-title">FootballSanci</h1>
            <div className="ranking-list">
                {players.map((player, index) => {
                    const isExpanded = expandedPlayer === player.id;
                    const displayRank = index + 1;

                    return (
                        <div
                            key={player.id}
                            className={`ranking-item ${getRankColor(displayRank)} ${isExpanded ? 'expanded' : ''}`}
                            onClick={(e) => {
                                if (!e.target.closest('.stat-controls') && !e.target.closest('.fame-input')) {
                                    togglePlayerExpansion(player.id);
                                }
                            }}
                        >
                            <div className="ranking-item-main">
                                <div className="rank-badge">
                                    <span className="rank-number">{displayRank}</span>
                                </div>
                                <div className="player-info">
                                    <h3 className="player-name">{player.name}</h3>
                                </div>
                                <FameDisplay
                                    playerId={player.id}
                                    fame={player.fame}
                                    currentUser={currentUser}
                                    onUpdate={updatePlayerFame}
                                />

                                <div className="player-points">
                                    <div className="points-group">
                                        <span className={`points-value ${getPointsColorClass(displayRank)}`}>
                                            {player.points || 0}
                                        </span>
                                        <span className="points-label">Points</span>
                                    </div>
                                    {player.value !== undefined && (
                                        <div className="value-group">
                                            <span className={`points-value ${getPointsColorClass(displayRank)}`}>
                                                {player.value}
                                            </span>
                                            <span className="points-label">Value</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="ranking-item-details">
                                    <div className="stats-grid">
                                        {[
                                            ["Winrate", player.winrate, false],
                                            ["Matches", player.matches, false],
                                            ["Wins", player.wins, true],
                                            ["Losses", player.losses, true],
                                            ["Draws", player.draws, true],
                                            ["Bonus 5 Goal", player.bonus5goal, true],
                                        ].map(([label, value, editable], i) => (
                                            <div key={i} className="stat-item">
                                                <span className="stat-label">{label}</span>
                                                <div className="stat-value-row">
                                                    <span className="stat-value">
                                                        {formatStatValue(label, value || 0)}
                                                    </span>
                                                    {currentUser && editable && (
                                                        <div className="stat-controls" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="stat-btn stat-btn-minus"
                                                                onClick={() => updatePlayerField(player.id, label.toLowerCase().replace(/\s/g, ''), -1)}
                                                            >
                                                                -
                                                            </button>
                                                            <button
                                                                className="stat-btn stat-btn-plus"
                                                                onClick={() => updatePlayerField(player.id, label.toLowerCase().replace(/\s/g, ''), 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Composant séparé pour gérer l'affichage et l'animation du Fame
function FameDisplay({ playerId, fame, currentUser, onUpdate }) {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const textWidth = textRef.current.scrollWidth;
                const overflow = textWidth > containerWidth;

                setIsOverflowing(overflow);

                // Définir la variable CSS pour l'animation
                if (overflow) {
                    textRef.current.style.setProperty('--container-width', `${containerWidth}px`);
                }
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        return () => window.removeEventListener('resize', checkOverflow);
    }, [fame]);

    return (
        <div className="player-fame-container" ref={containerRef}>
            {currentUser ? (
                <input
                    type="text"
                    className="player-fame fame-input"
                    value={fame || ''}
                    onChange={(e) => onUpdate(playerId, e.target.value)}
                    placeholder="Enter fame..."
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                fame && (
                    <p
                        ref={textRef}
                        className={`player-fame ${isOverflowing ? 'scrolling' : ''}`}
                    >
                        {fame}
                    </p>
                )
            )}
        </div>
    );
}

export default Ranking;