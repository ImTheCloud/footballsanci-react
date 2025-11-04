import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import Section from "../components/Section";
import { useSeason } from "../components/SeasonContext.jsx";

function Draw() {
    const { selectedSeason } = useSeason();
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        if (!selectedSeason) return;
        const fetchPlayers = async () => {
            try {
                const snapshot = await getDocs(collection(db, `seasons/${selectedSeason}/players`));
                const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPlayers(list);
            } catch (e) {
                console.error("Error loading players:", e);
            }
        };
        fetchPlayers();
    }, [selectedSeason]);

    const togglePlayerSelection = (player) => {
        setSelectedPlayers(prev => {
            if (prev.find(p => p.id === player.id)) return prev.filter(p => p.id !== player.id);
            return [...prev, player];
        });
    };

    const generateTeams = () => {
        if (selectedPlayers.length < 2) return;
        let shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
        let team1 = [], team2 = [], value1 = 0, value2 = 0;

        for (let p of shuffled) {
            if (value1 <= value2 && value1 + p.value <= 1.5) {
                team1.push(p);
                value1 += p.value;
            } else if (value2 + p.value <= 1.5) {
                team2.push(p);
                value2 += p.value;
            } else {
                if (value1 < value2 && value1 + p.value <= 1.5) {
                    team1.push(p);
                    value1 += p.value;
                } else if (value2 + p.value <= 1.5) {
                    team2.push(p);
                    value2 += p.value;
                }
            }
        }
        setTeams([team1, team2]);
    };

    return (
        <Section >
            <div>
                {players.map(player => (
                    <button
                        key={player.id}
                        onClick={() => togglePlayerSelection(player)}
                    >
                        {player.name} - {player.value}
                    </button>
                ))}
            </div>

            <div>
                <button onClick={generateTeams} disabled={selectedPlayers.length < 2}>
                    Generate Teams
                </button>
            </div>

            {teams.length === 2 && (
                <div>
                    <div>
                        <h3>Team 1</h3>
                        <ul>
                            {teams[0].map(p => (
                                <li key={p.id}>{p.name} ({p.value})</li>
                            ))}
                        </ul>
                        <p>Total: {teams[0].reduce((sum, p) => sum + p.value, 0)}</p>
                    </div>
                    <div>
                        <h3>Team 2</h3>
                        <ul>
                            {teams[1].map(p => (
                                <li key={p.id}>{p.name} ({p.value})</li>
                            ))}
                        </ul>
                        <p>Total: {teams[1].reduce((sum, p) => sum + p.value, 0)}</p>
                    </div>
                </div>
            )}
        </Section>
    );
}

export default Draw;