import React, { useState, useEffect, useRef } from 'react';
import './Players.css';

const PlayerCard = ({ player, isSelected, onToggle }) => (
    <button
        className={`player-card ${isSelected ? 'selected' : ''}`}
        onClick={onToggle}
        aria-pressed={isSelected}
    >
        <h4 className="player-card-name">{player.name}</h4>
        <span className="player-card-value">
            {Number(player.value || 0).toFixed(2)}
        </span>
    </button>
);

const TempPlayerCard = ({ onAdd }) => {
    const [tempName, setTempName] = useState('');
    const [tempValue, setTempValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        if (isAdding && formRef.current) {
            setTimeout(() => {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [isAdding]);

    const handleAdd = () => {
        const normalizedValue = tempValue.replace(',', '.');
        const parsed = parseFloat(normalizedValue);
        if (tempName.trim() && !isNaN(parsed) && parsed >= 0) {
            const rounded = Number(parsed.toFixed(2));
            onAdd({
                id: `temp-${Date.now()}`,
                name: tempName.trim(),
                value: rounded,
                isTemporary: true,
            });
            setTempName('');
            setTempValue('');
            setIsAdding(false);
        }
    };

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