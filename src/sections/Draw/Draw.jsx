import React, { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import "./Draw.css";
import NextMatch from "./NextMatch.jsx";
import Players from "./Players.jsx";
import MatchInfo from "./MatchInfo.jsx";

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
        if (field === "scoreTeam1") {
            setScoreTeam1(value);
        } else if (field === "scoreTeam2") {
            setScoreTeam2(value);
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

            await setDoc(matchRef, finalMatchData);

            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            await deleteDoc(liveMatchRef);

            setTeams([]);
            setLiveMatch(null);
            setSelectedPlayers([]);
            setScoreTeam1(0);
            setScoreTeam2(0);

            console.log("Match saved successfully and Live cleared!");
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
                    {/* Affiche toujours les joueurs en premier */}
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
                    <MatchInfo
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