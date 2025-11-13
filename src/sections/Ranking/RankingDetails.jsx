import React from "react";
import "./styles/RankingDetails.css";

const StatControls = ({ onIncrement, onDecrement }) => (
    <div className="stat-controls" onClick={(e) => e.stopPropagation()}>
        <button className="stat-btn stat-btn-minus" onClick={onDecrement}>
            −
        </button>
        <button className="stat-btn stat-btn-plus" onClick={onIncrement}>
            +
        </button>
    </div>
);

const StatItem = ({ label, value, editable, currentUser, onUpdate, format }) => (
    <div className="stat-item">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
            <span className="stat-value">{format ? format(value) : value}</span>
            {currentUser && editable && (
                <StatControls
                    onIncrement={() => onUpdate(1)}
                    onDecrement={() => onUpdate(-1)}
                />
            )}
        </div>
    </div>
);

const RankingDetails = ({ player, currentUser, onUpdateField, statsConfig }) => (
    <div className="ranking-item-details">
        <div className="stats-grid">
            {statsConfig.map(({ label, field, editable, format }) => (
                <StatItem
                    key={field}
                    label={label}
                    value={
                        field === "value"
                            ? Number(player.value || 0).toFixed(2)
                            : player[field] || 0
                    }
                    editable={editable}
                    currentUser={currentUser}
                    onUpdate={(delta) => onUpdateField(player.id, field, delta)}
                    format={format}
                />
            ))}
        </div>
    </div>
);

export default RankingDetails;