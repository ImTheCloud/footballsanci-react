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

    if (loading) return <p>Chargement...</p>;
    const player = players[currentIndex];

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
                <button onClick={handlePrev} disabled={currentIndex === 0}>◀</button>

                <div className="player-card">
                    <div className="rank-badge">#{player.rank}</div>
                    <h2>{player.name}</h2>
                    <p>{player.points} pts</p>

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
                            <div key={i}>
                                <span>{label}</span>: <span>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleNext} disabled={currentIndex === players.length - 1}>▶</button>
            </div>

            <p>{currentIndex + 1} / {players.length}</p>
        </div>
    );
}

export default Ranking;