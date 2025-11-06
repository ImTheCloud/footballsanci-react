import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import { useAuth } from "../components/AuthContext.jsx";
import "./Draw.css";

function Draw() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth();
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const todayDateISO = new Date().toISOString().split("T")[0];

    const [matchDetails, setMatchDetails] = useState({
        date: todayDateISO,
        startTime: "21:00",
        endTime: "22:00",
        location: "Fit Five",
    });

    // Fonction pour formater la date en JJ MM AA
    const formatDateToJJMMAA = (isoDate) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear());
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1️⃣ Récupérer tous les joueurs
                let playersList = [];
                if (currentUser) {
                    const playersSnapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));
                    playersList = playersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setPlayers(playersList);
                }

                // 2️⃣ Récupérer le dernier match
                const matchesQuery = query(
                    collection(db, `seasons/${selectedSeason}/matches`),
                    orderBy("date", "desc"),
                    limit(1)
                );

                const matchesSnapshot = await getDocs(matchesQuery);

                if (!matchesSnapshot.empty) {
                    const lastMatch = matchesSnapshot.docs[0].data();

                    setTeams([lastMatch.team1, lastMatch.team2]);

                    const dateParts = lastMatch.date.split("-");
                    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                    setMatchDetails({
                        date: isoDate,
                        startTime: lastMatch.startTime || "21:00",
                        endTime: lastMatch.endTime || "22:00",
                        location: lastMatch.location || "Fit Five",
                    });
                }
            } catch (e) {
                console.error("Error loading data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedSeason, currentUser]);
    const togglePlayerSelection = (player) => {
        setSelectedPlayers((prev) => {
            if (prev.find((p) => p.id === player.id)) {
                return prev.filter((p) => p.id !== player.id);
            }
            return [...prev, player];
        });
    };

    const generateBalancedTeams = (playersList) => {
        const MAX_DIFFERENCE = 1.5;
        let bestTeam1 = [];
        let bestTeam2 = [];
        let bestDifference = Infinity;
        const attempts = playersList.length <= 10 ? 1000 : 500;

        for (let attempt = 0; attempt < attempts; attempt++) {
            const shuffled = [...playersList].sort(() => Math.random() - 0.5);
            const team1 = [];
            const team2 = [];

            shuffled.forEach((player, index) => {
                (index % 2 === 0 ? team1 : team2).push(player);
            });

            const total1 = team1.reduce((sum, p) => sum + (p.value || 0), 0);
            const total2 = team2.reduce((sum, p) => sum + (p.value || 0), 0);
            const difference = Math.abs(total1 - total2);

            if (difference <= MAX_DIFFERENCE) return [team1, team2];
            if (difference < bestDifference) {
                bestDifference = difference;
                bestTeam1 = [...team1];
                bestTeam2 = [...team2];
            }
        }

        return [bestTeam1, bestTeam2];
    };

    const generateTeams = async () => {
        if (selectedPlayers.length < 2) return;

        const [team1, team2] = generateBalancedTeams(selectedPlayers);
        setTeams([team1, team2]);

        try {
            // Formater la date JJ-MM-AAAA pour Firestore
            const formattedDate = formatDateToJJMMAA(matchDetails.date);

            // Stocker nom + value pour chaque joueur
            const team1Data = team1.map(p => ({ name: p.name, value: p.value || 0 }));
            const team2Data = team2.map(p => ({ name: p.name, value: p.value || 0 }));

            const matchRef = doc(db, `seasons/${selectedSeason}/matches/${formattedDate}`);

            await setDoc(matchRef, {
                team1: team1Data,
                team2: team2Data,
                date: formattedDate,
                startTime: matchDetails.startTime,
                endTime: matchDetails.endTime,
                location: matchDetails.location,
            });

            console.log(`✅ Match saved successfully for ${formattedDate}`);
        } catch (error) {
            console.error("❌ Error saving match:", error);
        }
    };
    const calculateDifference = () => {
        if (teams.length !== 2) return 0;
        const total1 = teams[0].reduce((sum, p) => sum + (p.value || 0), 0);
        const total2 = teams[1].reduce((sum, p) => sum + (p.value || 0), 0);
        return Math.abs(total1 - total2);
    };

    const handleMatchDetailsChange = (field, value) => {
        setMatchDetails((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Réinitialiser les équipes et joueurs sélectionnés si la date change
        if (field === "date") {
            setSelectedPlayers([]);
            setTeams([]);
        }
    };

    if (loading) {
        return (
            <div className="draw-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const difference = calculateDifference();

    return (
        <div className="draw-container">
            <h1 className="section-title">Live Draw</h1>

            {currentUser && (
                <div className="match-details-form">
                    <div className="form-group">
                        <label htmlFor="match-date">Date</label>
                        <input
                            id="match-date"
                            type="date"
                            value={matchDetails.date}
                            onChange={(e) => handleMatchDetailsChange("date", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-start">Start Time</label>
                        <input
                            id="match-start"
                            type="time"
                            value={matchDetails.startTime}
                            onChange={(e) => handleMatchDetailsChange("startTime", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-end">End Time</label>
                        <input
                            id="match-end"
                            type="time"
                            value={matchDetails.endTime}
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-location">Location</label>
                        <select
                            id="match-location"
                            value={matchDetails.location}
                            onChange={(e) => handleMatchDetailsChange("location", e.target.value)}
                        >
                            <option value="Fit Five">Fit Five</option>
                            <option value="Halle">Halle</option>
                        </select>
                    </div>
                </div>
            )}

            {currentUser && players.length > 0 && (
                <div className="players-grid">
                    {players.map((player) => {
                        const isSelected = selectedPlayers.find((p) => p.id === player.id);
                        return (
                            <button
                                key={player.id}
                                className={`player-card ${isSelected ? "selected" : ""}`}
                                onClick={() => togglePlayerSelection(player)}
                                onTouchEnd={(e) => e.currentTarget.blur()}
                            >
                                <h4 className="player-card-name">{player.name}</h4>
                                <span className="player-card-value">{player.value}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {currentUser && (
                <div className="generate-section">
                    <div className="selected-counter">
                        <span className="selected-counter-number">{selectedPlayers.length}</span> / {players.length} players selected
                    </div>
                    <button
                        className="generate-button"
                        onClick={generateTeams}
                        disabled={selectedPlayers.length < 2}
                    >
                        Generate Teams
                    </button>
                </div>
            )}

            {teams.length === 2 && (
                <div className="teams-wrapper">
                    <div className="teams-balance-info">
                        <span className="balance-label">Gap :</span>
                        <span className={`balance-value ${difference <= 1.5 ? "balanced" : "warning"}`}>
                            {difference.toFixed(2)}
                        </span>
                    </div>

                    <div className="teams-container">
                        {[0, 1].map((i) => (
                            <div key={i} className={`team-card team-${i + 1}`}>
                                <div className="team-header">
                                    <h3 className="team-title">Team {i + 1}</h3>
                                    <div className="team-total">
                                        {teams[i].reduce((sum, p) => sum + (p.value || 0), 0).toFixed(2)}
                                    </div>
                                </div>
                                <ul className="team-players">
                                    {teams[i].map((p) => (
                                        <li key={p.id} className="team-player-item">
                                            <span className="team-player-name">{p.name}</span>
                                            <span className="team-player-value">{p.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!currentUser && teams.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">⚽</div>
                    <p>No live match available. Check back soon!</p>
                </div>
            )}
        </div>
    );
}

export default Draw;