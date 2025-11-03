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
            } catch (e) {
                console.error("Error loading players:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const handleNext = () => {
        if (currentIndex < players.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const formatStatValue = (label, value) => {
        if (label === "Winrate") return `${value}%`;
        return value;
    };

    if (loading) {
        return (
            <div className="ranking-container">
                <p>Loading...</p>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="ranking-container">
                <p>No players found.</p>
            </div>
        );
    }

    const player = players[currentIndex];

    return (
        <div className="ranking-container">
            <div className="header">
                <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="season-select"
                >
                    {seasons.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="player-card">
                <div className="rank">#{player.rank}</div>
                <h2>{player.name}</h2>

                {player.fame && (
                    <p className="fame">"{player.fame}"</p>
                )}

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
                        <div key={i} className="stat-item">
                            <span className="stat-label">{label}</span>
                            <span className="stat-value">{formatStatValue(label, value)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="nav">
                <button onClick={handlePrev} disabled={currentIndex === 0}>← Prev</button>
                <span>{currentIndex + 1} / {players.length}</span>
                <button onClick={handleNext} disabled={currentIndex === players.length - 1}>Next →</button>
            </div>
        </div>
    );
}

export default Ranking;