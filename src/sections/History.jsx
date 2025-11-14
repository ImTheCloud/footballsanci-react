import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useSeason } from "../components/SeasonContext.jsx";

function History() {
    const { selectedSeason } = useSeason();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedSeason) return;

        const fetchMatches = async () => {
            setLoading(true);

            try {
                const snap = await getDocs(
                    collection(db, `seasons/${selectedSeason}/matches`)
                );

                const list = snap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // tri du plus récent au plus ancien (optionnel)
                list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

                setMatches(list);
            } catch (error) {
                console.error("Erreur chargement matchs:", error);
            }

            setLoading(false);
        };

        fetchMatches();
    }, [selectedSeason]);

    if (loading) return <p>Loading…</p>;
    if (matches.length === 0) return <p>No matches found.</p>;

    return (
        <div style={{ padding: "1rem" }}>
            <h2>Match History</h2>

            <ul style={{ listStyle: "none", padding: 0 }}>
                {matches.map((m) => (
                    <li
                        key={m.id}
                        style={{
                            padding: "10px",
                            marginBottom: "8px",
                            border: "1px solid #444",
                            borderRadius: "6px"
                        }}
                    >
                        <strong>Date:</strong> {m.date} <br />
                        <strong>Start:</strong> {m.startTime} <br />
                        <strong>End:</strong> {m.endTime} <br />
                        <strong>Location:</strong> {m.location} <br />
                        <strong>Team A:</strong> {m.teamA?.join(", ")} <br />
                        <strong>Team B:</strong> {m.teamB?.join(", ")}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default History;