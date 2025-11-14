import React, { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { calculateStats } from "../utils/calculateStats.js";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import "./styles/Draw.css";
import NextMatch from "./NextMatch.jsx";
import Players from "./Players.jsx";
import LiveDraw from "./LiveDraw.jsx";

// 🔥 Convert "Season 6" → 6
function extractSeasonNumber(label) {
    const match = label?.match(/\d+/);
    return match ? Number(match[0]) : NaN;
}

// Etat initial du match
const INITIAL_MATCH_DETAILS = {
    date: new Date().toISOString().split("T")[0],
    startTime: "21:00",
    endTime: "22:00",
    location: "Fit Five",
    gapLimit: 1.0,
};

// Formatage JJ-MM-AAAA
const formatDateToJJMMAA = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
};

// Total équipe
const calculateTeamTotal = (team) =>
    team.reduce((sum, player) => sum + (Number(player.value) || 0), 0);

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

    const teamsRef = useRef(null);
    const shouldScrollToTeams = useRef(false);

    // LOAD
    const fetchData = useCallback(async () => {
        if (!selectedSeason) return;
        setLoading(true);

        try {
            if (currentUser) {

                // 🔥 Load all seasons & extract numbers from labels like "Season 6"
                const seasonSnapshot = await getDocs(collection(db, "seasons"));

                const seasonNumbers = seasonSnapshot.docs
                    .map((d) => extractSeasonNumber(d.id))   // "Season 6" → 6
                    .filter((n) => !isNaN(n))
                    .sort((a, b) => a - b);

                const LAST_SEASON = seasonNumbers[seasonNumbers.length - 1];
                const selectedNum = extractSeasonNumber(selectedSeason);

                // 🔥 Si on sélectionne la dernière → charger celle d'avant
                const seasonToLoad =
                    selectedNum === LAST_SEASON ? LAST_SEASON - 1 : selectedNum;

                // Charger les joueurs
                const playersSnapshot = await getDocs(
                    collection(db, `seasons/Season ${seasonToLoad}/players`)
                );

                const playersList = playersSnapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));

                setPlayers(playersList);
            }

            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            const liveSnapshot = await getDoc(liveMatchRef);

            if (liveSnapshot.exists()) {
                const data = liveSnapshot.data();
                if (data.gapLimit === undefined && data.gap !== undefined) {
                    data.gapLimit = data.gap;
                }

                setTeams([data.team1, data.team2]);
                setLiveMatch(data);
                setScoreTeam1(data.scoreTeam1 || 0);
                setScoreTeam2(data.scoreTeam2 || 0);
            } else {
                setTeams([]);
                setLiveMatch(null);
                setScoreTeam1(0);
                setScoreTeam2(0);
            }
        } catch (e) {
            console.error("Error loading:", e);
        }

        setLoading(false);
    }, [selectedSeason, currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-scroll
    useEffect(() => {
        if (shouldScrollToTeams.current && teams.length === 2) {
            setTimeout(() => {
                if (teamsRef.current) {
                    teamsRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 120);
            shouldScrollToTeams.current = false;
        }
    }, [teams]);

    // Temp players
    const addTemporaryPlayer = useCallback((tempPlayer) => {
        setPlayers((prev) => [...prev, tempPlayer]);
        setSelectedPlayers((prev) => [...prev, tempPlayer]);
    }, []);

    const togglePlayerSelection = useCallback((player) => {
        setSelectedPlayers((prev) =>
            prev.some((p) => p.id === player.id)
                ? prev.filter((p) => p.id !== player.id)
                : [...prev, player]
        );
    }, []);

    // Balanced teams + FAILSAFE
    const generateBalancedTeams = useCallback(
        (playersList) => {
            const safePlayers = playersList.map((p) => ({
                ...p,
                value: Number(p.value) || 0,
            }));

            const MAX_DIFFERENCE = Number(matchDetails.gapLimit) || 0;
            let bestTeam1 = [];
            let bestTeam2 = [];
            let bestDifference = Infinity;

            const attempts = safePlayers.length <= 10 ? 1000 : 500;

            for (let i = 0; i < attempts; i++) {
                const shuffled = [...safePlayers].sort(() => Math.random() - 0.5);
                const t1 = [];
                const t2 = [];

                shuffled.forEach((player, index) => {
                    (index % 2 === 0 ? t1 : t2).push(player);
                });

                const total1 = calculateTeamTotal(t1);
                const total2 = calculateTeamTotal(t2);
                const diff = Math.abs(total1 - total2);

                if (diff <= MAX_DIFFERENCE) return [t1, t2];

                if (diff < bestDifference) {
                    bestDifference = diff;
                    bestTeam1 = t1;
                    bestTeam2 = t2;
                }
            }

            if (bestTeam1.length === 0 || bestTeam2.length === 0) {
                const half = Math.ceil(safePlayers.length / 2);
                return [safePlayers.slice(0, half), safePlayers.slice(half)];
            }

            return [bestTeam1, bestTeam2];
        },
        [matchDetails.gapLimit]
    );

    // Generate teams
    const generateTeams = useCallback(async () => {
        if (selectedPlayers.length < 2) {
            console.warn("Not enough players to generate teams");
            return;
        }

        const playersList = [...selectedPlayers];
        const [team1, team2] = generateBalancedTeams(playersList);

        const total1 = calculateTeamTotal(team1);
        const total2 = calculateTeamTotal(team2);
        const valueDifference = Math.abs(total1 - total2);

        setTeams([team1, team2]);
        setScoreTeam1(0);
        setScoreTeam2(0);

        try {
            const formattedDate = formatDateToJJMMAA(matchDetails.date);
            const liveRef = doc(db, `seasons/${selectedSeason}/matches/Live`);

            const matchData = {
                team1: team1.map((p) => ({
                    name: p.name,
                    value: Number(p.value || 0).toFixed(2),
                })),
                team2: team2.map((p) => ({
                    name: p.name,
                    value: Number(p.value || 0).toFixed(2),
                })),
                date: formattedDate,
                startTime: matchDetails.startTime,
                endTime: matchDetails.endTime,
                location: matchDetails.location,
                gapLimit: Number(matchDetails.gapLimit).toFixed(2),
                valueDifference: Number(valueDifference.toFixed(2)),
                scoreTeam1: 0,
                scoreTeam2: 0,
            };

            await setDoc(liveRef, matchData);
            setLiveMatch(matchData);
        } catch (e) {
            console.error("Error writing live match:", e);
        }
    }, [selectedPlayers, matchDetails, selectedSeason, generateBalancedTeams]);

    const handleGenerateTeams = useCallback(() => {
        if (selectedPlayers.length < 2) return;
        shouldScrollToTeams.current = true;
        generateTeams();
    }, [selectedPlayers, generateTeams]);

    // Score change
    const handleScoreChange = useCallback((field, value) => {
        const n = Number(value) || 0;
        if (field === "scoreTeam1") setScoreTeam1(n);
        else setScoreTeam2(n);
    }, []);

    // Save match
    const saveMatch = useCallback(async () => {
        if (!liveMatch) return;

        try {
            const formattedDate = liveMatch.date;
            const matchRef = doc(db, `seasons/${selectedSeason}/matches/${formattedDate}`);

            const finalData = {
                ...liveMatch,
                scoreTeam1,
                scoreTeam2,
            };

            await setDoc(matchRef, finalData);

            const s1 = Number(scoreTeam1);
            const s2 = Number(scoreTeam2);
            const team1Players = liveMatch.team1 || [];
            const team2Players = liveMatch.team2 || [];

            let result = "draw";
            if (s1 > s2) result = "team1";
            if (s2 > s1) result = "team2";

            const margin = Math.abs(s1 - s2);
            const bonus = result === "draw" ? 0 : Math.floor(margin / 5);

            const updatePlayerStats = async (playerName, change) => {
                const ref = doc(db, `seasons/${selectedSeason}/players/${playerName}`);
                const snap = await getDoc(ref);
                if (!snap.exists()) return;

                const d = snap.data();
                const wins = (d.wins || 0) + (change.winDelta || 0);
                const draws = (d.draws || 0) + (change.drawDelta || 0);
                const losses = (d.losses || 0) + (change.lossDelta || 0);
                const bonus5goal = (d.bonus5goal || 0) + (change.bonusDelta || 0);

                const stats = calculateStats(wins, draws, losses, bonus5goal);

                await updateDoc(ref, {
                    wins,
                    draws,
                    losses,
                    bonus5goal,
                    ...stats,
                    lastMatchDate: formattedDate,
                });
            };

            const updates = [];

            if (result === "draw") {
                team1Players.forEach((p) => updates.push(updatePlayerStats(p.name, { drawDelta: 1 })));
                team2Players.forEach((p) => updates.push(updatePlayerStats(p.name, { drawDelta: 1 })));
            } else if (result === "team1") {
                team1Players.forEach((p) =>
                    updates.push(updatePlayerStats(p.name, { winDelta: 1, bonusDelta: bonus }))
                );
                team2Players.forEach((p) =>
                    updates.push(updatePlayerStats(p.name, { lossDelta: 1 }))
                );
            } else {
                team2Players.forEach((p) =>
                    updates.push(updatePlayerStats(p.name, { winDelta: 1, bonusDelta: bonus }))
                );
                team1Players.forEach((p) =>
                    updates.push(updatePlayerStats(p.name, { lossDelta: 1 }))
                );
            }

            await Promise.all(updates);

            await deleteDoc(doc(db, `seasons/${selectedSeason}/matches/Live`));

            setTeams([]);
            setLiveMatch(null);
            setSelectedPlayers([]);
            setScoreTeam1(0);
            setScoreTeam2(0);
        } catch (e) {
            console.error("Error saving match:", e);
        }
    }, [liveMatch, scoreTeam1, scoreTeam2, selectedSeason]);

    // Match details
    const handleMatchDetailsChange = useCallback((field, value) => {
        setMatchDetails((prev) => {
            let newValue = value;

            if (field === "gapLimit") {
                const safe = (value ?? "").toString();
                const numeric = parseFloat(safe.replace(",", ".")) || 0;
                newValue = numeric.toFixed(2);
            }
            return { ...prev, [field]: newValue };
        });
    }, []);

    if (loading) {
        return (
            <div className="draw-container"></div>
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