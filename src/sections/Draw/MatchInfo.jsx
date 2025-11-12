import React, { useMemo, useEffect, useState } from 'react';
import './MatchInfo.css';

// Compute the total value of a team based on its players.
const calculateTeamTotal = (team) =>
    team.reduce((sum, player) => sum + (Number(player.value) || 0), 0);

/* ------------------------ Time helpers for countdown ----------------------- */
const parseMatchDateTime = (dateStr, timeStr) => {
    // dateStr format expected: DD-MM-YYYY, timeStr: HH:mm
    if (!dateStr || !timeStr) return null;
    const [d, m, y] = (dateStr || '').split('-').map(Number);
    const [hh, mm] = (timeStr || '').split(':').map(Number);
    if (![d, m, y, hh, mm].every((n) => Number.isFinite(n))) return null;
    // Local time
    return new Date(y, m - 1, d, hh, mm, 0, 0);
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatDuration = (ms) => {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (days > 0) {
        return `${days}d ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    }
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const useMatchCountdown = (matchData) => {
    const start = parseMatchDateTime(matchData?.date, matchData?.startTime);
    const end = parseMatchDateTime(matchData?.date, matchData?.endTime);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [matchData?.date, matchData?.startTime, matchData?.endTime]);

    if (!start || !end) {
        return { phase: 'invalid', text: '—' };
    }

    if (now < start.getTime()) {
        return { phase: 'before', text: `Starts in ${formatDuration(start.getTime() - now)}` };
    }
    if (now >= start.getTime() && now < end.getTime()) {
        return { phase: 'during', text: `Ends in ${formatDuration(end.getTime() - now)}` };
    }
    return { phase: 'after', text: 'Match finished' };
};

/* --------------------------- Match Info component -------------------------- */
// Displays static match information when teams have been generated.
// This version uses a compact card layout with icons and a responsive grid.
const MatchInfoDisplay = ({ matchData }) => {
    // If no match data is provided, show an empty state
    if (!matchData) {
        return (
            <div className="match-details-card">
                <h3 className="match-details-header">Match Info</h3>
                <div className="match-details-empty">No match info available.</div>
            </div>
        );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { phase, text } = useMatchCountdown(matchData);

    return (
        <div className="match-details-card">
            <h3 className="match-details-header">Match Info</h3>
            <div className="match-details-grid">
                <div className="match-details-item">
                    <span className="match-details-icon">📅</span>
                    <div className="match-details-content">
                        <span className="match-details-label">Date</span>
                        <span className="match-details-value">{matchData.date}</span>
                    </div>
                </div>
                <div className="match-details-item">
                    <span className="match-details-icon">🕒</span>
                    <div className="match-details-content">
                        <span className="match-details-label">Start</span>
                        <span className="match-details-value">{matchData.startTime}</span>
                    </div>
                </div>
                <div className="match-details-item">
                    <span className="match-details-icon">🕒</span>
                    <div className="match-details-content">
                        <span className="match-details-label">End</span>
                        <span className="match-details-value">{matchData.endTime}</span>
                    </div>
                </div>
                <div className="match-details-item">
                    <span className="match-details-icon">📍</span>
                    <div className="match-details-content">
                        <span className="match-details-label">Location</span>
                        <span className="match-details-value">{matchData.location}</span>
                    </div>
                </div>
                <div className="match-details-item">
                    <span className="match-details-icon">↔️</span>
                    <div className="match-details-content">
                        <span className="match-details-label">Gap</span>
                        <span className="match-details-value">{matchData.gap}</span>
                    </div>
                </div>

                {/* NEW: Live countdown */}
                <div
                    className={`match-details-item ${
                        phase === 'after' ? 'countdown-finished' : 'countdown-live'
                    }`}
                >
                    <span className="match-details-icon">⏳</span>
                    <div className="match-details-content">
                        <span className="match-details-label">Countdown</span>
                        <span className="match-details-value">{text}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Card showing a single team and its players.
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

// Inputs for entering final scores for each team.
const ScoreInput = ({ scoreTeam1, scoreTeam2, onChange }) => {
    const handleFocus = (e) => {
        e.target.select();
    };
    const handleChange = (team, value) => {
        const parsed = parseInt(value, 10);
        onChange(team, isNaN(parsed) ? 0 : parsed);
    };
    return (
        <div className="score-input-wrapper">
            <input
                type="number"
                min="0"
                value={scoreTeam1}
                onFocus={handleFocus}
                onChange={(e) => handleChange('scoreTeam1', e.target.value)}
                className="score-input score-input-team1"
            />
            <span className="score-separator">-</span>
            <input
                type="number"
                min="0"
                value={scoreTeam2}
                onFocus={handleFocus}
                onChange={(e) => handleChange('scoreTeam2', e.target.value)}
                className="score-input score-input-team2"
            />
        </div>
    );
};

// Section for saving a match and entering the final score.
const SaveMatchSection = ({ scoreTeam1, scoreTeam2, onScoreChange, onSave, disabled }) => (
    <div className="save-match-section">
        <ScoreInput
            scoreTeam1={scoreTeam1}
            scoreTeam2={scoreTeam2}
            onChange={onScoreChange}
        />
        <button className="generate-button" onClick={onSave} disabled={disabled}>
            Save Match
        </button>
    </div>
);

/**
 * MatchInfo displays the match information, generated teams, and score input/save
 * controls. It uses MatchInfoDisplay to show match metadata and TeamCard
 * components to render each team. When the user is logged in, the save
 * controls are displayed.
 */
const MatchInfo = ({
                   teams,
                   matchData,
                   scoreTeam1,
                   scoreTeam2,
                   onScoreChange,
                   onSaveMatch,
                   currentUser,
               }) => (
    <div className="teams-wrapper">
        <MatchInfoDisplay matchData={matchData} />
        <div className="teams-container">
            {teams.map((team, index) => (
                <TeamCard key={index} team={team} index={index} />
            ))}
        </div>
        {currentUser && (
            <SaveMatchSection
                scoreTeam1={scoreTeam1}
                scoreTeam2={scoreTeam2}
                onScoreChange={onScoreChange}
                onSave={onSaveMatch}
                disabled={false}
            />
        )}
    </div>
);

export default MatchInfo;