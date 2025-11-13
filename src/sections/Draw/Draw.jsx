import React, { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import "./Draw.css";
import NextMatch from "./NextMatch.jsx";
import Players from "./Players.jsx";
import LiveDraw from "./LiveDraw.jsx";

// Etat initial du match
const INITIAL_MATCH_DETAILS = {
    date: new Date().toISOString().split("T")[0],
    startTime: "21:00",
    endTime: "22:00",
    location: "Fit Five",
    gap: 1,
};

// Formatage de date JJ-MM-AAAA
const formatDateToJJMMAA = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
};

// Calcule le total d’une équipe
const calculateTeamTotal = (team) =>
    team.reduce((sum, player) => sum + (player.value || 0), 0);

// Calcule les stats (matches, winrate, points, value) à partir des wins/draws/losses/bonus5goal
const calculateStats = (wins = 0, draws = 0, losses = 0, bonus5goal = 0) => {
    const matches = wins + draws + losses;
    const winrate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : 0;
    const points = wins * 3 + draws + bonus5goal;
    const value = matches > 0
        ? (10 * (0.9 * ((3 * wins + draws) / (3 * matches)) + 0.1 * Math.min(bonus5goal / matches, 1))).toFixed(2)
        : 0;

    return {
        matches,
        winrate: parseFloat(winrate),
        points,
        value: parseFloat(value),
    };
};

function Draw() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth();

    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [matchDetails, setMatchDetails] = useState(INITIAL_MATCH_DETAILS);
    const [liveMatch, setLiveMatch] = useState(null);
    const [scoreTeam1, setScoreTeam1] = useState(0);
    const [scoreTeam2, setScoreTeam2] = useState(0);

    // Références pour l’auto-scroll
    const teamsRef = useRef(null);
    const shouldScrollToTeams = useRef(false);

    // Chargement des données
    const fetchData = useCallback(async () => {
        if (!selectedSeason) return;

        setLoading(true);
        try {
            if (currentUser) {
                const playersSnapshot = await getDocs(
                    collection(db, `seasons/${selectedSeason}/players`)
                );
                const playersList = playersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setPlayers(playersList);
            }

            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            const liveMatchSnapshot = await getDoc(liveMatchRef);

            if (liveMatchSnapshot.exists()) {
                const liveMatchData = liveMatchSnapshot.data();
                setTeams([liveMatchData.team1, liveMatchData.team2]);
                setLiveMatch(liveMatchData);
                setScoreTeam1(liveMatchData.scoreTeam1 || 0);
                setScoreTeam2(liveMatchData.scoreTeam2 || 0);
            } else {
                setTeams([]);
                setLiveMatch(null);
                setScoreTeam1(0);
                setScoreTeam2(0);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedSeason, currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-scroll lorsqu’on génère les équipes
    useEffect(() => {
        if (shouldScrollToTeams.current && teams.length === 2 && teamsRef.current) {
            setTimeout(() => {
                teamsRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
            shouldScrollToTeams.current = false;
        }
    }, [teams]);

    // Gestion des joueurs temporaires
    const addTemporaryPlayer = useCallback((tempPlayer) => {
        setPlayers((prev) => [...prev, tempPlayer]);
        setSelectedPlayers((prev) => [...prev, tempPlayer]);
    }, []);

    // Sélection / désélection de joueurs
    const togglePlayerSelection = useCallback((player) => {
        setSelectedPlayers((prev) =>
            prev.find((p) => p.id === player.id)
                ? prev.filter((p) => p.id !== player.id)
                : [...prev, player]
        );
    }, []);

    // Algorithme de génération équilibrée
    const generateBalancedTeams = useCallback((playersList) => {
        const MAX_DIFFERENCE = matchDetails.gap;
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

            const total1 = calculateTeamTotal(team1);
            const total2 = calculateTeamTotal(team2);
            const diff = Math.abs(total1 - total2);

            if (diff <= MAX_DIFFERENCE) {
                return [team1, team2];
            }

            if (diff < bestDifference) {
                bestDifference = diff;
                bestTeam1 = team1;
                bestTeam2 = team2;
            }
        }

        return [bestTeam1, bestTeam2];
    }, [matchDetails.gap]);

    // Génère et enregistre les équipes
    const generateTeams = useCallback(async () => {
        if (selectedPlayers.length < 2) return;

        const [team1, team2] = generateBalancedTeams(selectedPlayers);
        setTeams([team1, team2]);

        setScoreTeam1(0);
        setScoreTeam2(0);

        try {
            const formattedDate = formatDateToJJMMAA(matchDetails.date);
            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);

            const matchData = {
                team1: team1.map((p) => ({ name: p.name, value: p.value || 0 })),
                team2: team2.map((p) => ({ name: p.name, value: p.value || 0 })),
                date: formattedDate,
                startTime: matchDetails.startTime,
                endTime: matchDetails.endTime,
                location: matchDetails.location,
                gap: matchDetails.gap ?? 1.5,
                scoreTeam1: 0,
                scoreTeam2: 0,
            };

            await setDoc(liveMatchRef, matchData);
            setLiveMatch(matchData);
        } catch (error) {
            console.error("Error saving live match:", error);
        }
    }, [selectedPlayers, matchDetails, generateBalancedTeams, selectedSeason]);

    // Gestion du clic sur le bouton « Generate Teams »
    const handleGenerateTeams = useCallback(() => {
        if (selectedPlayers.length < 2) return;
        shouldScrollToTeams.current = true;
        generateTeams();
    }, [selectedPlayers, generateTeams]);

    // Mise à jour des scores
    const handleScoreChange = useCallback((field, value) => {
        const numericValue = Number(value) || 0;

        if (field === "scoreTeam1") {
            setScoreTeam1(numericValue);
        } else if (field === "scoreTeam2") {
            setScoreTeam2(numericValue);
        }
    }, []);

    // Sauvegarde du match et suppression de l’état Live
    const saveMatch = useCallback(async () => {
        if (!liveMatch) return;

        try {
            const formattedDate = liveMatch.date;
            const matchRef = doc(db, `seasons/${selectedSeason}/matches/${formattedDate}`);

            const finalMatchData = {
                ...liveMatch,
                scoreTeam1,
                scoreTeam2,
            };

            // Sauvegarde du match final dans l'historique
            await setDoc(matchRef, finalMatchData);

            // --- Mise à jour des stats des joueurs dans la collection players ---
            const s1 = Number(scoreTeam1) || 0;
            const s2 = Number(scoreTeam2) || 0;
            const team1Players = liveMatch.team1 || [];
            const team2Players = liveMatch.team2 || [];

            let result;
            if (s1 > s2) {
                result = "team1";
            } else if (s2 > s1) {
                result = "team2";
            } else {
                result = "draw";
            }

            const margin = Math.abs(s1 - s2);
            // Chaque tranche de 5 buts d'écart donne +1 de bonus5goal pour les gagnants
            const bonusSteps = result === "draw" ? 0 : Math.floor(margin / 5);

            const updatePlayerStats = async (
                playerName,
                { winDelta = 0, drawDelta = 0, lossDelta = 0, bonusDelta = 0 }
            ) => {
                if (!playerName) return;

                // L'id du document est le nom du joueur
                const playerRef = doc(db, `seasons/${selectedSeason}/players/${playerName}`);
                const snap = await getDoc(playerRef);

                if (!snap.exists()) {
                    console.warn("Player document not found for", playerName);
                    return;
                }

                const data = snap.data();

                const wins = (data.wins || 0) + winDelta;
                const draws = (data.draws || 0) + drawDelta;
                const losses = (data.losses || 0) + lossDelta;
                const bonus5goal = (data.bonus5goal || 0) + bonusDelta;

                const stats = calculateStats(wins, draws, losses, bonus5goal);

                await updateDoc(playerRef, {
                    wins,
                    draws,
                    losses,
                    bonus5goal,
                    ...stats,
                    // On garde la dernière date à laquelle le joueur a joué
                    lastMatchDate: formattedDate,
                });
            };

            const updates = [];

            if (result === "draw") {
                // Egalité : +1 draw pour tous les joueurs
                team1Players.forEach((p) => {
                    updates.push(updatePlayerStats(p.name, { drawDelta: 1 }));
                });
                team2Players.forEach((p) => {
                    updates.push(updatePlayerStats(p.name, { drawDelta: 1 }));
                });
            } else if (result === "team1") {
                // Team 1 gagne
                team1Players.forEach((p) => {
                    updates.push(
                        updatePlayerStats(p.name, { winDelta: 1, bonusDelta: bonusSteps })
                    );
                });
                team2Players.forEach((p) => {
                    updates.push(updatePlayerStats(p.name, { lossDelta: 1 }));
                });
            } else if (result === "team2") {
                // Team 2 gagne
                team2Players.forEach((p) => {
                    updates.push(
                        updatePlayerStats(p.name, { winDelta: 1, bonusDelta: bonusSteps })
                    );
                });
                team1Players.forEach((p) => {
                    updates.push(updatePlayerStats(p.name, { lossDelta: 1 }));
                });
            }

            // On attend que toutes les mises à jour de joueurs soient terminées
            await Promise.all(updates);

            // Ensuite on supprime le match Live
            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            await deleteDoc(liveMatchRef);

            setTeams([]);
            setLiveMatch(null);
            setSelectedPlayers([]);
            setScoreTeam1(0);
            setScoreTeam2(0);
        } catch (error) {
            console.error("Error saving match:", error);
        }
    }, [liveMatch, selectedSeason, scoreTeam1, scoreTeam2]);

    // Mise à jour des détails de match
    const handleMatchDetailsChange = useCallback((field, value) => {
        setMatchDetails((prev) => ({ ...prev, [field]: value }));

        if (field === "date") {
            setSelectedPlayers([]);
        }
    }, []);

    // Si chargement, affichage d’une attente
    if (loading) {
        return (
            <div className="draw-container">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const hasTeams = teams.length === 2;
    const canGenerateTeams = selectedPlayers.length >= 2;

    return (
        <div className="draw-container">
            {currentUser && (
                <>
                    <h2 className="section-title">Live Draw</h2>
                    {players.length > 0 && (
                        <Players
                            players={players}
                            selectedPlayers={selectedPlayers}
                            onToggle={togglePlayerSelection}
                            onAddTemp={addTemporaryPlayer}
                        />
                    )}

                    {/* NextMatch avec le bouton de génération inclus et situé sous les joueurs */}
                    <NextMatch
                        matchDetails={matchDetails}
                        onChange={handleMatchDetailsChange}
                        selectedCount={selectedPlayers.length}
                        totalCount={players.length}
                        onGenerate={handleGenerateTeams}
                        disabled={!canGenerateTeams}
                    />
                </>
            )}

            {hasTeams && (
                <div ref={teamsRef}>
                    <LiveDraw
                        teams={teams}
                        matchData={liveMatch}
                        scoreTeam1={scoreTeam1}
                        scoreTeam2={scoreTeam2}
                        onScoreChange={handleScoreChange}
                        onSaveMatch={saveMatch}
                        currentUser={currentUser}
                    />
                </div>
            )}

            {!currentUser && !hasTeams && (
                <div className="empty-state">
                    <div className="empty-state-icon">⚽</div>
                    <p>No live match available. Check back soon!</p>
                </div>
            )}
        </div>
    );
}

export default Draw;