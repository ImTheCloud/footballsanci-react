import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase.js";
import { calculateStats } from "../utils/calculateStats.js";
import { useSeason } from "../../components/SeasonContext.jsx";
import { useAuth } from "../../components/AuthContext.jsx";
import RankingItem from "./RankingItem.jsx";
import "./styles/Ranking.css";

// ======================= CONSTANTES & FONCTIONS LOCALES =======================

// Classes de couleur en fonction du rang
const RANK_COLORS = {
    1: "rank-gold",
    2: "rank-silver",
    3: "rank-bronze",
    default: "rank-default",
};

// Configuration des stats affichées dans le détail
const STATS_CONFIG = [
    { label: "Winrate", field: "winrate", editable: false, format: (val) => `${val}%` },
    { label: "Matches", field: "matches", editable: false },
    { label: "Wins", field: "wins", editable: true },
    { label: "Losses", field: "losses", editable: true },
    { label: "Draws", field: "draws", editable: true },
    { label: "Bonus 5 Goal", field: "bonus5goal", editable: true },
];

// Tri des joueurs pour le ranking
const comparePlayers = (a, b) => {
    const aMatches = a.matches || 0;
    const bMatches = b.matches || 0;
    const aPoints = a.points || 0;
    const bPoints = b.points || 0;
    const aValue = a.value || 0;
    const bValue = b.value || 0;

    // 1. Joueurs avec matchs en premier
    if (aMatches === 0 && bMatches > 0) return 1;
    if (bMatches === 0 && aMatches > 0) return -1;

    // 2. Points décroissants
    if (bPoints !== aPoints) return bPoints - aPoints;

    // 3. Moins de matches en premier
    if (aMatches !== bMatches) return aMatches - bMatches;

    // 4. Value décroissante
    return bValue - aValue;
};

// Génération du "dense ranking" (même rang pour égalité, sans trous)
const generateDenseRanks = (players) => {
    const ranks = [];
    let currentRank = 1;
    let uniqueRankCount = 0;

    players.forEach((player, i) => {
        if (
            i > 0 &&
            players[i - 1].matches > 0 &&
            player.points === players[i - 1].points &&
            player.matches === players[i - 1].matches &&
            player.value === players[i - 1].value
        ) {
            // Même stats -> même rang
            ranks.push(currentRank);
        } else if (player.matches > 0) {
            // Nouveau joueur avec au moins un match -> nouveau rang
            currentRank = uniqueRankCount + 1;
            ranks.push(currentRank);
            uniqueRankCount++;
        } else {
            // Joueur sans match : rang sera attribué plus tard
            ranks.push(null);
        }
    });

    const nonNullRanks = ranks.filter((r) => r !== null);
    const lastRank = nonNullRanks.length > 0 ? Math.max(...nonNullRanks) : 0;
    const zeroMatchStart = lastRank + 1;

    // Tous les joueurs sans match prennent le même rang, après les autres
    return ranks.map((r) => (r === null ? zeroMatchStart : r));
};

// Récupère la classe CSS en fonction du rang
const getRankColor = (rank) => RANK_COLORS[rank] || RANK_COLORS.default;

// ============================= ÉTATS SIMPLES UI ==============================

const LoadingState = () => (
    <div className="ranking-container">
        <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading rankings...</p>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="ranking-container">
        <div className="empty-state">
            <p>No players found for this season.</p>
        </div>
    </div>
);

// =============================== MAIN COMPONENT ==============================

function Ranking() {
    const { selectedSeason } = useSeason();
    const { currentUser } = useAuth();

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlayer, setExpandedPlayer] = useState(null);

    // ---------- Fetch players ----------
    useEffect(() => {
        if (!selectedSeason) return;

        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(
                    collection(db, `seasons/${selectedSeason}/players`)
                );

                const list = snapshot.docs
                    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
                    .sort(comparePlayers);

                setPlayers(list);
                setExpandedPlayer(null);
            } catch (error) {
                console.error("Error loading players:", error);
            }

            setLoading(false);
        };

        fetchPlayers();
    }, [selectedSeason]);

    // ---------- Mise à jour des stats d’un joueur ----------
    const updatePlayerField = useCallback(
        async (playerId, field, delta) => {
            const player = players.find((p) => p.id === playerId);
            if (!player) return;

            const newValue = Math.max(0, (player[field] || 0) + delta);

            const updatedPlayer = { ...player, [field]: newValue };

            const stats = calculateStats(
                updatedPlayer.wins,
                updatedPlayer.draws,
                updatedPlayer.losses,
                updatedPlayer.bonus5goal
            );

            // Update local
            setPlayers((prev) =>
                prev
                    .map((p) =>
                        p.id === playerId ? { ...p, [field]: newValue, ...stats } : p
                    )
                    .sort(comparePlayers)
            );

            // Update Firestore
            try {
                await updateDoc(
                    doc(db, `seasons/${selectedSeason}/players/${playerId}`),
                    {
                        [field]: newValue,
                        ...stats,
                        value: Number(stats.value),
                    }
                );
            } catch (error) {
                console.error("Error updating player:", error);
            }
        },
        [players, selectedSeason]
    );

    // ---------- Mise à jour du texte de "fame" ----------
    const updatePlayerFame = useCallback(
        async (playerId, newFame) => {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === playerId ? { ...p, fame: newFame } : p
                )
            );

            try {
                await updateDoc(
                    doc(db, `seasons/${selectedSeason}/players/${playerId}`),
                    { fame: newFame }
                );
            } catch (error) {
                console.error("Error updating fame:", error);
            }
        },
        [selectedSeason]
    );

    // ---------- Gestion expand / collapse ----------
    const togglePlayerExpansion = useCallback((playerId) => {
        setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
    }, []);

    if (loading) return <LoadingState />;
    if (players.length === 0) return <EmptyState />;

    // ---------- Génération des rangs ----------
    const ranks = generateDenseRanks(players);

    return (
        <div className="ranking-container">
            <h1 className="section-title">FootballSanci</h1>

            <div className="ranking-list">
                {players.map((player, index) => {
                    const rank = ranks[index];
                    const rankColor = getRankColor(rank);

                    return (
                        <RankingItem
                            key={player.id}
                            player={player}
                            rank={rank}
                            rankColor={rankColor}
                            isExpanded={expandedPlayer === player.id}
                            onToggle={togglePlayerExpansion}
                            currentUser={currentUser}
                            onUpdateField={updatePlayerField}
                            onUpdateFame={updatePlayerFame}
                            statsConfig={STATS_CONFIG}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default Ranking;