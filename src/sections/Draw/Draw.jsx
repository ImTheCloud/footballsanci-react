import React, { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import "./Draw.css";
import MatchPanel from "./MatchPanel.jsx";
import Players from "./Players.jsx";
import Teams from "./Teams.jsx";

// Constants
const INITIAL_MATCH_DETAILS = {
    date: new Date().toISOString().split("T")[0],
    startTime: "21:00",
    endTime: "22:00",
    location: "Fit Five",
    gap: 1,
};


// Utility Functions
const formatDateToJJMMAA = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
};

const calculateTeamTotal = (team) =>
    team.reduce((sum, player) => sum + (player.value || 0), 0);

// Components
const LoadingState = () => (
    <div className="draw-container">
        <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading...</p>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="empty-state">
        <div className="empty-state-icon">⚽</div>
        <p>No live match available. Check back soon!</p>
    </div>
);


const GenerateSection = ({ selectedCount, totalCount, onGenerate, disabled }) => (
    <div className="generate-section">
        <div className="selected-counter">
            <span className="selected-counter-number">{selectedCount}</span> / {totalCount} players selected
        </div>
        <button
            className="generate-button"
            onClick={onGenerate}
            disabled={disabled}
        >
            Generate Teams
        </button>
    </div>
);


// Main Component
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

    // Ref to the teams container; used to scroll to the end of the teams section
    const teamsRef = useRef(null);
    const shouldScrollToTeams = useRef(false);

    // Fetch data from Firebase
    const fetchData = useCallback(async () => {
        if (!selectedSeason) return;

        setLoading(true);
        try {
            // Fetch players if user is logged in
            if (currentUser) {
                const playersSnapshot = await getDocs(
                    collection(db, `seasons/${selectedSeason}/players`)
                );
                const playersList = playersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPlayers(playersList);
            }

            // Fetch live match
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

    // Scroll to the end of the teams section whenever two teams have been generated.
    // This effect runs every time `teams` changes and ensures the bottom of the
    // teams cards is visible without scrolling past other sections of the page.
    useEffect(() => {
        if (shouldScrollToTeams.current && teams.length === 2 && teamsRef.current) {
            // Allow the DOM to update before scrolling
            setTimeout(() => {
                teamsRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
            // reset the flag so we don't auto-scroll on initial load or subsequent fetches
            shouldScrollToTeams.current = false;
        }
    }, [teams]);

    // Add temporary player
    const addTemporaryPlayer = useCallback((tempPlayer) => {
        setPlayers((prev) => [...prev, tempPlayer]);
        setSelectedPlayers((prev) => [...prev, tempPlayer]);
    }, []);

    // Toggle player selection
    const togglePlayerSelection = useCallback((player) => {
        setSelectedPlayers((prev) =>
            prev.find((p) => p.id === player.id)
                ? prev.filter((p) => p.id !== player.id)
                : [...prev, player]
        );
    }, []);

    // Generate balanced teams algorithm
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

    // Generate and save teams to Live
    const generateTeams = useCallback(async () => {
        if (selectedPlayers.length < 2) return;

        const [team1, team2] = generateBalancedTeams(selectedPlayers);
        setTeams([team1, team2]);

        // Reset scores when generating new teams
        setScoreTeam1(0);
        setScoreTeam2(0);

        try {
            const formattedDate = formatDateToJJMMAA(matchDetails.date);
            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);

            const matchData = {
                team1: team1.map(p => ({ name: p.name, value: p.value || 0 })),
                team2: team2.map(p => ({ name: p.name, value: p.value || 0 })),
                date: formattedDate,
                startTime: matchDetails.startTime,
                endTime: matchDetails.endTime,
                location: matchDetails.location,
                gap: matchDetails.gap ?? 1.5,
                scoreTeam1: 0,
                scoreTeam2: 0,
            };

            await setDoc(liveMatchRef, matchData);

            // Update local state
            setLiveMatch(matchData);
        } catch (error) {
            console.error("Error saving live match:", error);
        }
    }, [selectedPlayers, matchDetails, generateBalancedTeams, selectedSeason]);

    // Simple wrapper that triggers team generation immediately. If there
    // are not enough selected players, it does nothing.
    const handleGenerateTeams = useCallback(() => {
        if (selectedPlayers.length < 2) return;
        // set flag so the next teams update scrolls into view
        shouldScrollToTeams.current = true;
        generateTeams();
    }, [selectedPlayers, generateTeams]);

    // Handle score change
    const handleScoreChange = useCallback((field, value) => {
        if (field === "scoreTeam1") {
            setScoreTeam1(value);
        } else if (field === "scoreTeam2") {
            setScoreTeam2(value);
        }
    }, []);

    // Save match permanently and delete Live
    const saveMatch = useCallback(async () => {
        if (!liveMatch) return;

        try {
            // Save to permanent collection with date as ID
            const formattedDate = liveMatch.date;
            const matchRef = doc(db, `seasons/${selectedSeason}/matches/${formattedDate}`);

            const finalMatchData = {
                ...liveMatch,
                scoreTeam1,
                scoreTeam2,
            };

            await setDoc(matchRef, finalMatchData);

            // Delete Live match
            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            await deleteDoc(liveMatchRef);

            // Clear local state
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

    // Handle match details changes
    const handleMatchDetailsChange = useCallback((field, value) => {
        setMatchDetails((prev) => ({ ...prev, [field]: value }));

        if (field === "date") {
            setSelectedPlayers([]);
        }
    }, []);

    // Render
    if (loading) {
        return <LoadingState />;
    }

    const hasTeams = teams.length === 2;
    const canGenerateTeams = selectedPlayers.length >= 2;

    return (
        <div className="draw-container">
            {currentUser && (
                <>
                    <MatchPanel
                        matchDetails={matchDetails}
                        onChange={handleMatchDetailsChange}
                    />

                    {players.length > 0 && (
                        <>
                            <Players
                                players={players}
                                selectedPlayers={selectedPlayers}
                                onToggle={togglePlayerSelection}
                                onAddTemp={addTemporaryPlayer}
                            />

                            <GenerateSection
                                selectedCount={selectedPlayers.length}
                                totalCount={players.length}
                                onGenerate={handleGenerateTeams}
                                disabled={!canGenerateTeams}
                            />
                        </>
                    )}
                </>
            )}

            {/* No loading animation overlay is shown during team generation */}
            {hasTeams && (
                <div ref={teamsRef}>
                    <Teams
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

            {!currentUser && !hasTeams && <EmptyState />}
        </div>
    );
}

export default Draw;