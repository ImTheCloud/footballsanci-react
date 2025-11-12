import React, { useState, useEffect, useRef } from 'react';
import './Players.css';

// Renders a single player card. If selected, it applies a modifier class
// and calls onToggle when clicked.
const PlayerCard = ({ player, isSelected, onToggle }) => (
    <button
        className={`player-card ${isSelected ? 'selected' : ''}`}
        onClick={onToggle}
        aria-pressed={isSelected}
    >
        <h4 className="player-card-name">{player.name}</h4>
        <span className="player-card-value">{player.value}</span>
    </button>
);

// Card used for adding a temporary player. It toggles between a button and a small form.
const TempPlayerCard = ({ onAdd }) => {
    const [tempName, setTempName] = useState('');
    const [tempValue, setTempValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const formRef = useRef(null);

    // Scroll the form into view when it appears.
    useEffect(() => {
        if (isAdding && formRef.current) {
            setTimeout(() => {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [isAdding]);

    // Attempt to add the temporary player when the button is clicked
    const handleAdd = () => {
        const normalizedValue = tempValue.replace(',', '.');
        const value = parseFloat(normalizedValue);
        if (tempName.trim() && !isNaN(value) && value >= 0) {
            onAdd({
                id: `temp-${Date.now()}`,
                name: tempName.trim(),
                value: value,
                isTemporary: true,
            });
            setTempName('');
            setTempValue('');
            setIsAdding(false);
        }
    };

    // Handle Enter key on inputs to jump to next field or submit
    const handleKeyPress = (e, field) => {
        if (e.key === 'Enter') {
            if (field === 'name' && tempName.trim()) {
                document.getElementById('temp-value-input')?.focus();
            } else if (field === 'value') {
                handleAdd();
            }
        }
    };

    if (!isAdding) {
        return (
            <button
                className="player-card temp-player-card-trigger"
                onClick={() => setIsAdding(true)}
            >
                <h4 className="player-card-name">Temp Player</h4>
                <span className="player-card-value">+</span>
            </button>
        );
    }

    return (
        <div ref={formRef} className="player-card temp-player-card-form">
            <input
                type="text"
                className="temp-player-input temp-player-name"
                placeholder="Name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'name')}
                autoFocus
            />
            <input
                id="temp-value-input"
                type="text"
                inputMode="decimal"
                className="temp-player-input temp-player-value"
                placeholder="Value"
                value={tempValue}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setTempValue(val);
                }}
                onKeyDown={(e) => {
                    if (
                        !/[0-9.,]/.test(e.key) &&
                        e.key !== 'Backspace' &&
                        e.key !== 'Delete' &&
                        e.key !== 'ArrowLeft' &&
                        e.key !== 'ArrowRight' &&
                        e.key !== 'Tab'
                    ) {
                        e.preventDefault();
                    }
                }}
                onKeyPress={(e) => handleKeyPress(e, 'value')}
                step="0.1"
                min="0"
            />
            <div className="temp-player-actions">
                <button
                    className="temp-player-btn temp-player-add"
                    onClick={handleAdd}
                    disabled={!tempName.trim() || !tempValue || isNaN(parseFloat(tempValue))}
                >
                    ✓
                </button>
            </div>
        </div>
    );
};

/**
 * Players renders a grid of PlayerCard components. It takes the full list of
 * players, the currently selected players, and callbacks for toggling
 * selection and adding temporary players.
 */
const Players = ({ players, selectedPlayers, onToggle, onAddTemp }) => (
    <div className="players-grid">
        {players.map((player) => (
            <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayers.some((p) => p.id === player.id)}
                onToggle={() => onToggle(player)}
            />
        ))}
        <TempPlayerCard onAdd={onAddTemp} />
    </div>
);

export default Players;