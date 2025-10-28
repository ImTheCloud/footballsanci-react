import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { motion, AnimatePresence } from "framer-motion";
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
                console.error("Erreur joueurs :", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const handleNext = () => {
        if (currentIndex < players.length - 1) setCurrentIndex(currentIndex + 1);
    };
    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    if (loading) return <p className="loading">Chargement...</p>;
    const player = players[currentIndex];

    const getCardGradient = (rank) => {
        switch (rank) {
            case 1: return "linear-gradient(135deg, #FFD700, #FFC700)";
            case 2: return "linear-gradient(135deg, #C0C0C0, #B0B0B0)";
            case 3: return "linear-gradient(135deg, #CD7F32, #B06C2F)";
            default: return "linear-gradient(135deg, #14293E, #0A1C30)";
        }
    };

    return (
        <div className="ranking-container">
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

            <div className="carousel">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="nav-btn">◀</button>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="player-card"
                        style={{ background: getCardGradient(player.rank) }}
                    >
                        <div className="card-glow"></div>
                        <div className="rank-badge">#{player.rank}</div>
                        <h2 className="player-name">{player.name}</h2>
                        <p className="player-points">{player.points} pts</p>

                        <div className="stats-grid">
                            {[
                                ["Winrate", `${player.winrate}%`],
                                ["Matchs", player.matches],
                                ["Victoires", player.wins],
                                ["Défaites", player.losses],
                                ["Nuls", player.draws],
                                ["Valeur", player.value],
                                ["Bonus 5 Goals", player.bonus5goal],
                            ].map(([label, value], i) => (
                                <div key={i} className="stat-card">
                                    <span className="stat-label">{label}</span>
                                    <span className="stat-value">{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button onClick={handleNext} disabled={currentIndex === players.length - 1} className="nav-btn">▶</button>
            </div>

            <p className="counter">{currentIndex + 1} / {players.length}</p>
        </div>
    );
}

export default Ranking;
