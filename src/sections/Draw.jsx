import React, { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";
import { useAuth } from "../components/AuthContext.jsx";
import "./Draw.css";

// Constants
const INITIAL_MATCH_DETAILS = {
    date: new Date().toISOString().split("T")[0],
    startTime: "21:00",
    endTime: "22:00",
    location: "Fit Five",
    gap: 1.5,
};

const LOCATIONS = ["Fit Five", "Halle"];
const GAP_STEP = 0.1;
const MIN_GAP = 0;

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

const MatchInfoRow = ({ label, children }) => (
    <div className="match-row">
        <label>{label}:</label>
        {children}
    </div>
);

const GapControl = ({ value, onChange }) => (
    <div className="gap-control">
        <button
            type="button"
            onClick={() => onChange(Math.max(MIN_GAP, parseFloat((value - GAP_STEP).toFixed(1))))}
            aria-label="Decrease gap"
        >
            −
        </button>
        <span>{value.toFixed(1)}</span>
        <button
            type="button"
            onClick={() => onChange(parseFloat((value + GAP_STEP).toFixed(1)))}
            aria-label="Increase gap"
        >
            +
        </button>
    </div>
);

const MatchBox = ({ title, children }) => (
    <div className="match-box">
        <h3 className="match-info-title">{title}</h3>
        <div className="match-section">{children}</div>
    </div>
);

const MatchDetailsForm = ({ matchDetails, onChange }) => (
    <MatchBox title="Live Draw">
        <MatchInfoRow label="Date">
            <input
                type="date"
                value={matchDetails.date}
                onChange={(e) => onChange("date", e.target.value)}
            />
        </MatchInfoRow>
        <MatchInfoRow label="Start">
            <input
                type="time"
                value={matchDetails.startTime}
                onChange={(e) => onChange("startTime", e.target.value)}
            />
        </MatchInfoRow>
        <MatchInfoRow label="End">
            <input type="time" value={matchDetails.endTime} readOnly />
        </MatchInfoRow>
        <MatchInfoRow label="Location">
            <select
                value={matchDetails.location}
                onChange={(e) => onChange("location", e.target.value)}
            >
                {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                ))}
            </select>
        </MatchInfoRow>
        <MatchInfoRow label="Gap">
            <GapControl
                value={matchDetails.gap}
                onChange={(val) => onChange("gap", val)}
            />
        </MatchInfoRow>
    </MatchBox>
);

const MatchInfoDisplay = ({ matchData }) => (
    <MatchBox title="Match Info">
        {matchData ? (
            <>
                <MatchInfoRow label="Date">
                    <span className="match-value">{matchData.date}</span>
                </MatchInfoRow>
                <MatchInfoRow label="Start">
                    <span className="match-value">{matchData.startTime}</span>
                </MatchInfoRow>
                <MatchInfoRow label="End">
                    <span className="match-value">{matchData.endTime}</span>
                </MatchInfoRow>
                <MatchInfoRow label="Location">
                    <span className="match-value">{matchData.location}</span>
                </MatchInfoRow>
                <MatchInfoRow label="Gap">
                    <span className="match-value">{matchData.gap}</span>
                </MatchInfoRow>
            </>
        ) : (
            <div className="match-row">
                <p className="empty-message">No match info available.</p>
            </div>
        )}
    </MatchBox>
);

const PlayerCard = ({ player, isSelected, onToggle }) => (
    <button
        className={`player-card ${isSelected ? "selected" : ""}`}
        onClick={onToggle}
        aria-pressed={isSelected}
    >
        <h4 className="player-card-name">{player.name}</h4>
        <span className="player-card-value">{player.value}</span>
    </button>
);

const PlayersGrid = ({ players, selectedPlayers, onToggle }) => (
    <div className="players-grid">
        {players.map((player) => (
            <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayers.some(p => p.id === player.id)}
                onToggle={() => onToggle(player)}
            />
        ))}
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

const TeamCard = ({ team, index }) => {
    const teamTotal = useMemo(() => calculateTeamTotal(team), [team]);

    return (
        <div className={`team-card team-${index + 1}`}>
            <div className="team-header">
                <h3 className="team-title">Team {index + 1}</h3>
                <div className="team-total">{teamTotal.toFixed(2)}</div>
            </div>
            <ul className="team-players">
                {team.map((player) => (
                    <li key={player.id || player.name} className="team-player-item">
                        <span className="team-player-name">{player.name}</span>
                        <span className="team-player-value">{player.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SaveMatchSection = ({ onSave, disabled }) => (
    <div className="generate-section">
        <button
            className="generate-button"
            onClick={onSave}
            disabled={disabled}
        >
            Save Match
        </button>
    </div>
);

const TeamsDisplay = ({ teams, matchData, onSaveMatch, currentUser }) => (
    <div className="teams-wrapper">
        <MatchInfoDisplay matchData={matchData} />
        <div className="teams-container">
            {teams.map((team, index) => (
                <TeamCard key={index} team={team} index={index} />
            ))}
        </div>
        {currentUser && (
            <SaveMatchSection onSave={onSaveMatch} disabled={false} />
        )}
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
            } else {
                setTeams([]);
                setLiveMatch(null);
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
            };

            await setDoc(liveMatchRef, matchData);

            // Update local state
            setLiveMatch(matchData);
        } catch (error) {
            console.error("Error saving live match:", error);
        }
    }, [selectedPlayers, matchDetails, generateBalancedTeams, selectedSeason]);

    // Save match permanently and delete Live
    const saveMatch = useCallback(async () => {
        if (!liveMatch) return;

        try {
            // Save to permanent collection with date as ID
            const formattedDate = liveMatch.date;
            const matchRef = doc(db, `seasons/${selectedSeason}/matches/${formattedDate}`);

            await setDoc(matchRef, liveMatch);

            // Delete Live match
            const liveMatchRef = doc(db, `seasons/${selectedSeason}/matches/Live`);
            await deleteDoc(liveMatchRef);

            // Clear local state
            setTeams([]);
            setLiveMatch(null);
            setSelectedPlayers([]);

            console.log("Match saved successfully and Live cleared!");
        } catch (error) {
            console.error("Error saving match:", error);
        }
    }, [liveMatch, selectedSeason]);

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
                    <MatchDetailsForm
                        matchDetails={matchDetails}
                        onChange={handleMatchDetailsChange}
                    />

                    {players.length > 0 && (
                        <>
                            <PlayersGrid
                                players={players}
                                selectedPlayers={selectedPlayers}
                                onToggle={togglePlayerSelection}
                            />

                            <GenerateSection
                                selectedCount={selectedPlayers.length}
                                totalCount={players.length}
                                onGenerate={generateTeams}
                                disabled={!canGenerateTeams}
                            />
                        </>
                    )}
                </>
            )}

            {hasTeams && (
                <TeamsDisplay
                    teams={teams}
                    matchData={liveMatch}
                    onSaveMatch={saveMatch}
                    currentUser={currentUser}
                />
            )}

            {!currentUser && !hasTeams && <EmptyState />}
        </div>
    );
}

export default Draw;