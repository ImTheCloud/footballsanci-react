import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useSeason } from "../../components/SeasonContext.jsx";
import "./History.css";

// Parse "DD-MM-YYYY" → Date
function parseDDMMYYYY(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}

function History() {
    const { selectedSeason } = useSeason();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(3); // 3 derniers matches

    // Quand on change de saison, on réinitialise à 3
    useEffect(() => {
        setVisibleCount(3);
    }, [selectedSeason]);

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchMatches = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(
                    collection(db, `seasons/${selectedSeason}/matches`)
                );

                const baseList = snap.docs
                    // on ignore le doc "Live"
                    .filter((docSnap) => docSnap.id !== "Live")
                    .map((docSnap) => {
                        const data = docSnap.data() || {};
                        const date = data.date || docSnap.id || "";
                        const parsedDate = parseDDMMYYYY(date);

                        return {
                            id: docSnap.id,
                            parsedDate,
                            date,
                            startTime: data.startTime || "",
                            endTime: data.endTime || "",
                            location: data.location || "",
                            scoreTeam1: Number(data.scoreTeam1 ?? 0),
                            scoreTeam2: Number(data.scoreTeam2 ?? 0),
                            valueDifference:
                                data.valueDifference !== undefined
                                    ? Number(data.valueDifference)
                                    : null,
                            team1: Array.isArray(data.team1) ? data.team1 : [],
                            team2: Array.isArray(data.team2) ? data.team2 : [],
                            team1TotalValue: Number(data.team1TotalValue ?? 0),
                            team2TotalValue: Number(data.team2TotalValue ?? 0),
                        };
                    });

                // 1) trier du plus ancien au plus récent pour attribuer les numéros
                const ascending = [...baseList].sort((a, b) => {
                    const da = a.parsedDate;
                    const db = b.parsedDate;
                    if (da && db) return da - db;
                    if (da && !db) return -1;
                    if (!da && db) return 1;
                    return 0;
                });

                ascending.forEach((match, index) => {
                    // plus ancien = match #1
                    match.matchNumber = index + 1;
                });

                // 2) pour l’affichage, on veut les plus récents en haut
                const descending = [...ascending].sort((a, b) => {
                    const da = a.parsedDate;
                    const db = b.parsedDate;
                    if (da && db) return db - da;
                    if (da && !db) return 1;
                    if (!da && db) return -1;
                    return 0;
                });

                const finalList = descending.map(({ parsedDate, ...rest }) => rest);

                setMatches(finalList);
            } catch (error) {
                console.error("Erreur chargement matchs:", error);
            }
            setLoading(false);
        };

        fetchMatches();
    }, [selectedSeason]);

    if (loading) {
        return (
            <div className="history-container">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Loading matches...</p>
                </div>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="history-container">
                <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <p>No matches found for this season.</p>
                </div>
            </div>
        );
    }

    const visibleMatches = matches.slice(0, visibleCount);
    const canLoadMore = visibleCount < matches.length;

    return (
        <div className="history-container">
            <h2 className="section-title">Match History</h2>

            <div className="history-list">
                {visibleMatches.map((m) => {
                    const s1 = m.scoreTeam1 ?? 0;
                    const s2 = m.scoreTeam2 ?? 0;

                    let resultClass = "history-card--draw";
                    if (s1 > s2) resultClass = "history-card--team1";
                    if (s2 > s1) resultClass = "history-card--team2";

                    return (
                        <article
                            key={m.id}
                            className={`history-card ${resultClass}`}
                        >
                            {/* HEADER : match#, date, time, location, score */}
                            <header className="history-card-header">
                                <div className="history-header-main">
                                    <div className="history-first-row">
                                        <span className="history-match-number">
                                            Match #{m.matchNumber}
                                        </span>
                                        <span className="history-date">
                                            {m.date}
                                        </span>
                                    </div>

                                    {(m.startTime || m.endTime) && (
                                        <div className="history-time-row">
                                            <span className="history-time-icon">
                                                🕒
                                            </span>
                                            <span className="history-time-text">
                                                {m.startTime}
                                                {m.endTime
                                                    ? ` - ${m.endTime}`
                                                    : ""}
                                            </span>
                                        </div>
                                    )}

                                    {m.location && (
                                        <div className="history-location-row">
                                            <span className="history-location-icon">
                                                📍
                                            </span>
                                            <span className="history-location-text">
                                                {m.location}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="history-score-pill">
                                    <span className="history-score-team">
                                        {s1}
                                    </span>
                                    <span className="history-score-separator">
                                        -
                                    </span>
                                    <span className="history-score-team">
                                        {s2}
                                    </span>
                                </div>
                            </header>

                            {/* TEAMS */}
                            <div className="history-teams">
                                <div className="history-team-card history-team-card-1">
                                    <div className="history-team-header">
                                        <span className="history-team-label">
                                            Team 1
                                        </span>
                                        <span className="history-team-total">
                                            {m.team1TotalValue.toFixed(2)}
                                        </span>
                                    </div>
                                    <ul className="history-player-list">
                                        {m.team1.map((p, idx) => (
                                            <li
                                                key={idx}
                                                className="history-player-item"
                                            >
                                                <span className="history-player-name">
                                                    {p.name}
                                                </span>
                                                <span className="history-player-value">
                                                    {Number(
                                                        p.value ?? 0
                                                    ).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="history-team-card history-team-card-2">
                                    <div className="history-team-header">
                                        <span className="history-team-label">
                                            Team 2
                                        </span>
                                        <span className="history-team-total">
                                            {m.team2TotalValue.toFixed(2)}
                                        </span>
                                    </div>
                                    <ul className="history-player-list">
                                        {m.team2.map((p, idx) => (
                                            <li
                                                key={idx}
                                                className="history-player-item"
                                            >
                                                <span className="history-player-name">
                                                    {p.name}
                                                </span>
                                                <span className="history-player-value">
                                                    {Number(
                                                        p.value ?? 0
                                                    ).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* META BAS (pas de GapLimit, juste diff) */}
                            <footer className="history-card-footer">
                                {m.valueDifference !== null && (
                                    <span className="history-meta-chip">
                                        Value diff:{" "}
                                        {m.valueDifference.toFixed(2)}
                                    </span>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </div>

            {canLoadMore && (
                <div className="history-load-more-wrapper">
                    <button
                        className="history-load-more-btn"
                        onClick={() =>
                            setVisibleCount((c) =>
                                Math.min(c + 1, matches.length)
                            )
                        }
                    >
                        Load more matches
                    </button>
                </div>
            )}
        </div>
    );
}

export default History;