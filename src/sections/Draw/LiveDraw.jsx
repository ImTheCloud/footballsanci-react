import React, { useMemo, useEffect, useState } from 'react';
import './styles/LiveDraw.css';

// Compute the total value of a team based on its players (fallback only).
const calculateTeamTotal = (team) =>
    team.reduce((sum, player) => sum + (Number(player.value) || 0), 0);

/* ------------------------ Time helpers for Timer ----------------------- */
const parseMatchDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [d, m, y] = (dateStr || '').split('-').map(Number);
    const [hh, mm] = (timeStr || '').split(':').map(Number);
    if (![d, m, y, hh, mm].every((n) => Number.isFinite(n))) return null;
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
    if (days > 0) return `${days}d ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const useMatchTimer = (matchData) => {
    const start = parseMatchDateTime(matchData?.date, matchData?.startTime);
    const end = parseMatchDateTime(matchData?.date, matchData?.endTime);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [matchData?.date, matchData?.startTime, matchData?.endTime]);

    if (!start || !end) return { phase: 'invalid', text: '—' };
    if (now < start.getTime()) return { phase: 'before', text: `${formatDuration(start.getTime() - now)}` };
    if (now >= start.getTime() && now < end.getTime()) return { phase: 'during', text: `${formatDuration(end.getTime() - now)}` };
    return { phase: 'after', text: 'finished' };
};

/* --------------------------- Match Info component -------------------------- */

const MatchInfoDisplay = ({ matchData, Timer }) => {
    if (!matchData) {
        return (
            <div className="match-details-card">
                <div className="match-details-empty">No match info available.</div>
            </div>
        );
    }

    const { phase, text } = Timer;
    const timeRange =
        matchData.startTime && matchData.endTime
            ? `${matchData.startTime} - ${matchData.endTime}`
            : matchData.startTime || '—';

    const diff =
        matchData.valueDifference !== undefined
            ? Number(matchData.valueDifference).toFixed(2)
            : '—';

    return (
        <div className="match-details-card">
            <h3 className="section-title section-title--compact">Live Draw</h3>

            <div className="match-details-grid">
                {/* Timer */}
                <div className={`match-details-item Timer-${phase}`}>
                    <span className="match-details-icon">⏳</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Timer</span>
                        <span className="match-details-value match-details-value--Timer">
                            {text}
                        </span>
                    </div>
                </div>

                {/* Location */}
                <div className="match-details-item">
                    <span className="match-details-icon">📍</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Location</span>
                        <span className="match-details-value">{matchData.location}</span>
                    </div>
                </div>

                {/* Gap limit */}
                <div className="match-details-item">
                    <span className="match-details-icon">📏</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Gap limit</span>
                        <span className="match-details-value">{matchData.gapLimit}</span>
                    </div>
                </div>

                {/* Value diff */}
                <div className="match-details-item">
                    <span className="match-details-icon">↔️</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Value diff</span>
                        <span className="match-details-value">{diff}</span>
                    </div>
                </div>

                {/* Date */}
                <div className="match-details-item">
                    <span className="match-details-icon">📅</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Date</span>
                        <span className="match-details-value">{matchData.date}</span>
                    </div>
                </div>

                {/* Time */}
                <div className="match-details-item">
                    <span className="match-details-icon">🕒</span>
                    <div className="match-details-text">
                        <span className="match-details-label">Time</span>
                        <span className="match-details-value">{timeRange}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ---------------------------- Teams & Score ----------------------------

const TeamCard = ({ team, index, total }) => {
    // ✅ On privilégie la valeur venant de Firestore, fallback local si manquante
    const teamTotal = total != null ? Number(total) : calculateTeamTotal(team);

    return (
        <div className={`team-card team-${index + 1}`}>
            <div className="team-header">
                <h3 className="team-title">Team {index + 1}</h3>
                <div className="team-total">{teamTotal.toFixed(2)}</div>
            </div>
            <ul className="team-players">
                {team.map((player) => (
                    <li key={player.name} className="team-player-item">
                        <span className="team-player-name">{player.name}</span>
                        <span className="team-player-value">
                            {Number(player.value).toFixed(2)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ScoreInput = ({ scoreTeam1, scoreTeam2, onChange }) => (
    <div className="score-input-wrapper">
        <input
            type="number"
            min="0"
            value={scoreTeam1}
            onChange={(e) => onChange('scoreTeam1', e.target.value)}
            className="score-input score-input-team1"
        />
        <span className="score-separator">-</span>
        <input
            type="number"
            min="0"
            value={scoreTeam2}
            onChange={(e) => onChange('scoreTeam2', e.target.value)}
            className="score-input score-input-team2"
        />
    </div>
);

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

const LiveDraw = ({
                      teams,
                      matchData,
                      scoreTeam1,
                      scoreTeam2,
                      onScoreChange,
                      onSaveMatch,
                      currentUser,
                  }) => {
    const Timer = useMatchTimer(matchData || {});

    // ✅ Totaux venant direct de Firestore
    const teamTotalsFromDb = [
        matchData?.team1TotalValue,
        matchData?.team2TotalValue,
    ];

    return (
        <div className="teams-wrapper">
            <MatchInfoDisplay matchData={matchData} Timer={Timer} />
            <div className="teams-container">
                {teams.map((team, index) => (
                    <TeamCard
                        key={index}
                        team={team}
                        index={index}
                        total={teamTotalsFromDb[index]}
                    />
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
};

export default LiveDraw;