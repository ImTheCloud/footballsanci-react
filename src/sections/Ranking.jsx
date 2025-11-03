// Ranking.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "./Ranking.css";

function Ranking() {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animationClass, setAnimationClass] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const fetchSeasons = async () => {
            const snapshot = await getDocs(collection(db, "seasons"));
            const list = snapshot.docs.map((doc) => doc.id).sort();
            setSeasons(list);
            if (list.length > 0) setSelectedSeason(list[list.length - 1]);
        };
        fetchSeasons();
    }, []);

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
                setCurrentIndex(0);
                setAnimationClass("");
            } catch (e) {
                console.error("Error loading players:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const handleNext = () => {
        if (currentIndex < players.length - 1 && !isAnimating) {
            setIsAnimating(true);
            setAnimationClass("slide-out-left");
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                setAnimationClass("slide-in-right");
                setTimeout(() => {
                    setAnimationClass("");
                    setIsAnimating(false);
                }, 500);
            }, 500);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0 && !isAnimating) {
            setIsAnimating(true);
            setAnimationClass("slide-out-right");
            setTimeout(() => {
                setCurrentIndex(currentIndex - 1);
                setAnimationClass("slide-in-left");
                setTimeout(() => {
                    setAnimationClass("");
                    setIsAnimating(false);
                }, 500);
            }, 500);
        }
    };

    const formatStatValue = (label, value) => {
        if (label === "Winrate") {
            return `${value}%`;
        }
        return value;
    };

    if (loading) {
        return (
            <div className="ranking-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading rankings...</p>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="ranking-container">
                <p className="loading-text">No players found for this season.</p>
            </div>
        );
    }

    const player = players[currentIndex];

    return (
        <div className="ranking-container">

            {/* Season Select */}
            <div className="header">
                <div className="season-select">
                    <select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        {seasons.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="carousel">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isAnimating}
                    className="nav-button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div className="card-wrapper">
                    <div className={`player-card ${animationClass}`}>
                        {/* Rank Badge */}
                        <div className={`rank-badge ${player.rank <= 3 ? 'rank-top' : ''}`}>
                            <span className="rank-number">#{player.rank}</span>
                        </div>

                        {/* Player Info */}
                        <div className="player-header">
                            <div className="avatar-circle">
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="player-name">{player.name}</h2>
                        </div>

                        {/* Fame Quote */}
                        {player.fame && (
                            <div className="fame-container">
                                <svg className="quote-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 21C3 17.134 4.5 14 9 14C9 8.5 3 7 3 3C6 3 10 5.5 10 12V21H3ZM14 21C14 17.134 15.5 14 20 14C20 8.5 14 7 14 3C17 3 21 5.5 21 12V21H14Z" fill="currentColor" opacity="0.15"/>
                                </svg>
                                <p className="fame-text">{player.fame}</p>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            {[
                                ["Points", player.points],
                                ["Winrate", player.winrate],
                                ["Matches", player.matches],
                                ["Wins", player.wins],
                                ["Losses", player.losses],
                                ["Draws", player.draws],
                                ["Value", player.value],
                                ["Bonus 5", player.bonus5goal],
                            ].map(([label, value], i) => (
                                <div key={i} className="stat-card">
                                    <span className="stat-label">{label}</span>
                                    <span className="stat-value">{formatStatValue(label, value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === players.length - 1 || isAnimating}
                    className="nav-button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {/* Counter */}
            <div className="counter">
                <span className="counter-current">{currentIndex + 1}</span>
                <span className="counter-divider">/</span>
                <span className="counter-total">{players.length}</span>
            </div>
        </div>
    );
}

export default Ranking;