import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import "./Draw.css";

function Draw() {
    const { selectedSeason } = useSeason();
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPlayers(list);
            } catch (e) {
                console.error("Error loading players:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const togglePlayerSelection = (player) => {
        setSelectedPlayers(prev => {
            if (prev.find(p => p.id === player.id)) {
                return prev.filter(p => p.id !== player.id);
            }
            return [...prev, player];
        });
    };

    const generateTeams = () => {
        if (selectedPlayers.length < 2) return;

        let shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
        let team1 = [], team2 = [];

        shuffled.forEach((player, index) => {
            if (index % 2 === 0) {
                team1.push(player);
            } else {
                team2.push(player);
            }
        });

        setTeams([team1, team2]);
    };

    if (loading) {
        return (
            <div className="draw-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading players...</p>
                </div>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="draw-container">
                <div className="empty-state">
                    <div className="empty-state-icon">⚽</div>
                    <p>No players found for this season.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="draw-container">
            {/* Players Selection Grid */}
            <div className="players-grid">
                {players.map(player => {
                    const isSelected = selectedPlayers.find(p => p.id === player.id);
                    return (
                        <button
                            key={player.id}
                            className={`player-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => togglePlayerSelection(player)}
                            onBlur={(e) => {
                                // Force re-render of the button style when deselected
                                if (!isSelected) {
                                    e.currentTarget.blur();
                                }
                            }}
                        >
                            <h4 className="player-card-name">{player.name}</h4>
                            <span className="player-card-value">{player.value}</span>
                        </button>
                    );
                })}
            </div>

            {/* Generate Teams Section */}
            <div className="generate-section">
                <button
                    className="generate-button"
                    onClick={generateTeams}
                    disabled={selectedPlayers.length < 2}
                >
                    Generate Teams
                    {selectedPlayers.length > 0 && (
                        <span className="selected-count">{selectedPlayers.length}</span>
                    )}
                </button>
            </div>

            {/* Teams Display */}
            {teams.length === 2 && (
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
            )}
        </div>
    );
}

export default Draw;