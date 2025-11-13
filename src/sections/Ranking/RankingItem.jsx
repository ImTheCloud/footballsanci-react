import React, { useEffect, useRef, useState } from "react";
import "./styles/RankingItem.css";
import RankingDetails from "./RankingDetails.jsx";

const RankBadge = ({ rank }) => (
    <div className="rank-badge">
        <span className="rank-number">{rank}</span>
    </div>
);

const PlayerInfo = ({ name }) => (
    <div className="player-info">
        <h3 className="player-name">{name}</h3>
    </div>
);

// Affichage / édition du "fame" (texte défilant)
const FameDisplay = ({ playerId, fame, currentUser, onUpdate }) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const overflow =
                    textRef.current.scrollWidth > containerRef.current.offsetWidth;
                setIsOverflowing(overflow);

                if (overflow) {
                    textRef.current.style.setProperty(
                        "--container-width",
                        `${containerRef.current.offsetWidth}px`
                    );
                }
            }
        };

        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [fame]);

    return (
        <div className="player-fame-container" ref={containerRef}>
            {currentUser ? (
                <input
                    type="text"
                    className="player-fame fame-input"
                    value={fame || ""}
                    onChange={(e) => onUpdate(playerId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Enter fame..."
                />
            ) : (
                fame && (
                    <p
                        ref={textRef}
                        className={`player-fame ${
                            isOverflowing ? "scrolling" : ""
                        }`}
                    >
                        {fame}
                    </p>
                )
            )}
        </div>
    );
};

// Affichage des points + value
const PlayerPoints = ({ points, value, rankColor }) => (
    <div className="player-points">
        <div className="points-group">
            <span className={`points-value ${rankColor}`}>
                {Math.round(points || 0)}
            </span>
            <span className="points-label">Points</span>
        </div>

        <div className="value-group">
            <span className={`points-value ${rankColor}`}>
                {Number(value || 0).toFixed(2)}
            </span>
            <span className="points-label">Value</span>
        </div>
    </div>
);

const RankingItem = ({
                         player,
                         rank,
                         rankColor,
                         isExpanded,
                         onToggle,
                         currentUser,
                         onUpdateField,
                         onUpdateFame,
                         statsConfig,
                     }) => {
    const handleClick = (e) => {
        // On ignore les clics sur les contrôles + / - et input fame
        if (!e.target.closest(".stat-controls") && !e.target.closest(".fame-input")) {
            onToggle(player.id);
        }
    };

    return (
        <div
            className={`ranking-item ${rankColor} ${
                isExpanded ? "expanded" : ""
            }`}
            onClick={handleClick}
        >
            <div className="ranking-item-main">
                <RankBadge rank={rank} />
                <PlayerInfo name={player.name} />
                <FameDisplay
                    playerId={player.id}
                    fame={player.fame}
                    currentUser={currentUser}
                    onUpdate={onUpdateFame}
                />
                <PlayerPoints
                    points={player.points}
                    value={player.value}
                    rankColor={rankColor}
                />
            </div>

            {isExpanded && (
                <RankingDetails
                    player={player}
                    currentUser={currentUser}
                    onUpdateField={onUpdateField}
                    statsConfig={statsConfig}
                />
            )}
        </div>
    );
};

export default RankingItem;