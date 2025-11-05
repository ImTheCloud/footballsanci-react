import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import { useAuth } from "../components/AuthContext.jsx";
import "./Draw.css";

function Draw() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth(); // Get current user
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    // Match details state
    const [matchDetails, setMatchDetails] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '21:00',
        location: 'Fit Five',
        duration: '1h'
    });

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch players (only if authenticated)
                if (currentUser) {
                    const playersSnapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));
                    const playersList = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setPlayers(playersList);
                }

                const matchesQuery = query(
                    collection(db, `seasons/${selectedSeason}/matches`),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );

                const matchesSnapshot = await getDocs(matchesQuery);

                if (!matchesSnapshot.empty) {
                    const lastMatch = matchesSnapshot.docs[0].data();
                    // Only show last match if it's for the current season
                    if (lastMatch.seasonId === selectedSeason) {
                        setTeams([lastMatch.team1, lastMatch.team2]);
                        setMatchDetails({
                            date: lastMatch.date,
                            time: lastMatch.time,
                            location: lastMatch.location,
                            duration: lastMatch.duration
                        });

                        // Set selected players based on last match (only if authenticated)
                        if (currentUser) {
                            const allPlayers = [...lastMatch.team1, ...lastMatch.team2];
                            setSelectedPlayers(allPlayers);
                        }
                    }
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
        setSelectedPlayers(prev => {
            if (prev.find(p => p.id === player.id)) {
                return prev.filter(p => p.id !== player.id);
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
            let shuffled = [...playersList].sort(() => Math.random() - 0.5);
            let team1 = [];
            let team2 = [];

            shuffled.forEach((player, index) => {
                if (index % 2 === 0) {
                    team1.push(player);
                } else {
                    team2.push(player);
                }
            });

            const total1 = team1.reduce((sum, p) => sum + p.value, 0);
            const total2 = team2.reduce((sum, p) => sum + p.value, 0);
            const difference = Math.abs(total1 - total2);

            if (difference <= MAX_DIFFERENCE) {
                return [team1, team2];
            }

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

        // Save match to Firebase
        try {
            await addDoc(collection(db, `seasons/${selectedSeason}/matches`), {
                seasonId: selectedSeason,
                team1: team1,
                team2: team2,
                date: matchDetails.date,
                time: matchDetails.time,
                location: matchDetails.location,
                duration: matchDetails.duration,
                createdAt: new Date().toISOString()
            });
            console.log("Match saved successfully!");
        } catch (error) {
            console.error("Error saving match:", error);
        }
    };

    const calculateDifference = () => {
        if (teams.length !== 2) return 0;
        const total1 = teams[0].reduce((sum, p) => sum + p.value, 0);
        const total2 = teams[1].reduce((sum, p) => sum + p.value, 0);
        return Math.abs(total1 - total2);
    };

    const handleMatchDetailsChange = (field, value) => {
        setMatchDetails(prev => ({
            ...prev,
            [field]: value
        }));
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
            {/* Section Title */}
            <h1 className="section-title">Live Draw</h1>

            {/* Match Details Form - Only visible if authenticated */}
            {currentUser && (
                <div className="match-details-form">
                    <div className="form-group">
                        <label htmlFor="match-date">Date</label>
                        <input
                            id="match-date"
                            type="date"
                            value={matchDetails.date}
                            onChange={(e) => handleMatchDetailsChange('date', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-time">Time</label>
                        <input
                            id="match-time"
                            type="time"
                            value={matchDetails.time}
                            onChange={(e) => handleMatchDetailsChange('time', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-location">Location</label>
                        <select
                            id="match-location"
                            value={matchDetails.location}
                            onChange={(e) => handleMatchDetailsChange('location', e.target.value)}
                        >
                            <option value="Fit Five">Fit Five</option>
                            <option value="Halle">Halle</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="match-duration">Duration</label>
                        <select
                            id="match-duration"
                            value={matchDetails.duration}
                            onChange={(e) => handleMatchDetailsChange('duration', e.target.value)}
                        >
                            <option value="1h">1h</option>
                            <option value="1h30">1h30</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Players Selection Grid - Only visible if authenticated */}
            {currentUser && players.length > 0 && (
                <div className="players-grid">
                    {players.map(player => {
                        const isSelected = selectedPlayers.find(p => p.id === player.id);
                        return (
                            <button
                                key={player.id}
                                className={`player-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => togglePlayerSelection(player)}
                                onTouchEnd={(e) => {
                                    e.currentTarget.blur();
                                }}
                            >
                                <h4 className="player-card-name">{player.name}</h4>
                                <span className="player-card-value">{player.value}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Generate Teams Section - Only visible if authenticated */}
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

            {/* Teams Display - Always visible if teams exist */}
            {teams.length === 2 && (
                <div className="teams-wrapper">
                    {/* Teams Balance Info - Above teams */}
                    <div className="teams-balance-info">
                        <span className="balance-label">Gap:</span>
                        <span className={`balance-value ${difference <= 1.5 ? 'balanced' : 'warning'}`}>
                            {difference.toFixed(2)}
                        </span>
                    </div>

                    <div className="teams-container">
                        <div className="team-card team-1">
                            <div className="team-header">
                                <h3 className="team-title">Team 1</h3>
                                <div className="team-total">
                                    {teams[0].reduce((sum, p) => sum + p.value, 0).toFixed(2)}
                                </div>
                            </div>
                            <ul className="team-players">
                                {teams[0].map(p => (
                                    <li key={p.id} className="team-player-item">
                                        <span className="team-player-name">{p.name}</span>
                                        <span className="team-player-value">{p.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="team-card team-2">
                            <div className="team-header">
                                <h3 className="team-title">Team 2</h3>
                                <div className="team-total">
                                    {teams[1].reduce((sum, p) => sum + p.value, 0).toFixed(2)}
                                </div>
                            </div>
                            <ul className="team-players">
                                {teams[1].map(p => (
                                    <li key={p.id} className="team-player-item">
                                        <span className="team-player-name">{p.name}</span>
                                        <span className="team-player-value">{p.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state if not authenticated and no teams */}
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