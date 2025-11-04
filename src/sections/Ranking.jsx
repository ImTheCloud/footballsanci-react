import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import "./Ranking.css";

function Ranking() {
    const { selectedSeason } = useSeason();
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
                    .sort((a, b) => a.rank - b.rank);
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
            <div className="ranking-list">
                {players.map((player) => {
                    const isExpanded = expandedPlayer === player.id;
                    return (
                        <div
                            key={player.id}
                            className={`ranking-item ${getRankColor(player.rank)} ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => togglePlayerExpansion(player.id)}
                        >
                            <div className="ranking-item-main">
                                <div className="rank-badge">
                                    <span className="rank-number">{player.rank}</span>
                                </div>
                                <div className="player-info">
                                    <h3 className="player-name">{player.name}</h3>
                                </div>

                                <div className="player-points">
                                    <div className="points-group">
                                        <span className={`points-value ${getPointsColorClass(player.rank)}`}>{player.points || 0}</span>
                                        <span className="points-label">Points</span>
                                    </div>
                                    {player.value !== undefined && (
                                        <div className="value-group">
                                            <span className={`points-value ${getPointsColorClass(player.rank)}`}>{player.value}</span>
                                            <span className="points-label">Value</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {player.fame && (
                                <p className="player-fame">❝ {player.fame} ❞</p>
                            )}
                            {isExpanded && (
                                <div className="ranking-item-details">
                                    <div className="stats-grid">
                                        {[
                                            ["Winrate", player.winrate],
                                            ["Matches", player.matches],
                                            ["Wins", player.wins],
                                            ["Losses", player.losses],
                                            ["Draws", player.draws],
                                            ["Bonus 5 Goal", player.bonus5goal],
                                        ].map(([label, value], i) => (
                                            <div key={i} className="stat-item">
                                                <span className="stat-label">{label}</span>
                                                <span className="stat-value">{formatStatValue(label, value)}</span>
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

export default Ranking;
