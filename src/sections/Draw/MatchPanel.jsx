import React from 'react';
import './MatchPanel.css';

// Constants for location options and gap control steps
const LOCATIONS = ['Fit Five', 'Halle'];
const GAP_STEP = 0.1;
const MIN_GAP = 0;

// A row within the match panel form. Renders a label and a control.
const MatchInfoRow = ({ label, children }) => (
    <div className="match-row">
        <label>{label}:</label>
        {children}
    </div>
);

// Gap control with increment and decrement buttons and the current value.
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

// Wrapper component for grouping match info fields with a title.
const MatchBox = ({ title, children }) => (
    <div className="match-box">
        <h3 className="match-info-title">{title}</h3>
        <div className="match-section">{children}</div>
    </div>
);

/**
 * MatchPanel renders a form for entering match details such as date, time,
 * location and allowable gap between team totals. It exposes the form state
 * via matchDetails and onChange props.
 */
const MatchPanel = ({ matchDetails, onChange }) => (
    <MatchBox title="Live Draw">
        <MatchInfoRow label="Date">
            <input
                type="date"
                value={matchDetails.date}
                onChange={(e) => onChange('date', e.target.value)}
            />
        </MatchInfoRow>
        <MatchInfoRow label="Start">
            <input
                type="time"
                value={matchDetails.startTime}
                onChange={(e) => onChange('startTime', e.target.value)}
            />
        </MatchInfoRow>
        <MatchInfoRow label="End">
            <input
                type="time"
                value={matchDetails.endTime}
                onChange={(e) => onChange('endTime', e.target.value)}
            />
        </MatchInfoRow>
        <MatchInfoRow label="Location">
            <select
                value={matchDetails.location}
                onChange={(e) => onChange('location', e.target.value)}
            >
                {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                        {loc}
                    </option>
                ))}
            </select>
        </MatchInfoRow>
        <MatchInfoRow label="Gap">
            <GapControl
                value={matchDetails.gap}
                onChange={(val) => onChange('gap', val)}
            />
        </MatchInfoRow>
    </MatchBox>
);

export default MatchPanel;