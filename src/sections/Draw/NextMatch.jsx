import React, { useEffect, useMemo, useRef } from "react";
import "./NextMatch.css";

// Disponibles pour le sélecteur de lieu.
const LOCATIONS = ["Fit Five", "Halle"];
const GAP_STEP = 0.1;
const MIN_GAP = 0;

// Helpers date
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const getTodayISO = () => toISO(new Date());
const getNextSaturdayISO = () => {
    const t = new Date();
    const diff = ((6 - t.getDay()) % 7) || 7;
    const d = new Date(t);
    d.setDate(t.getDate() + diff);
    return toISO(d);
};

// Composant de ligne avec icône
const MatchInfoRow = ({ label, icon, children }) => (
    <div className="match-row">
        {icon && <span className="match-row-icon">{icon}</span>}
        <label>{label}:</label>
        {children}
    </div>
);

// Contrôle de la marge d’écart
const GapControl = ({ value, onChange }) => (
    <div className="gap-control">
        <button
            type="button"
            aria-label="Decrease gap"
            onClick={() => onChange(Math.max(MIN_GAP, +(value - GAP_STEP).toFixed(1)))}
        >
            −
        </button>
        <span>{Number(value).toFixed(1)}</span>
        <button
            type="button"
            aria-label="Increase gap"
            onClick={() => onChange(+(value + GAP_STEP).toFixed(1))}
        >
            +
        </button>
    </div>
);

// Conteneur principal
const MatchBox = ({ title, children }) => (
    <div className="match-box">
        <h3 className="match-info-title">{title}</h3>
        <div className="match-section">{children}</div>
    </div>
);

// Composant principal NextMatch
const NextMatch = ({
                      matchDetails,
                      onChange,
                      selectedCount = 0,
                      totalCount = 0,
                      onGenerate = () => {},
                      disabled = false,
                  }) => {
    const nextSaturday = useMemo(getNextSaturdayISO, []);
    const today = useMemo(getTodayISO, []);
    const didInit = useRef(false);

    useEffect(() => {
        if (didInit.current) return;
        const current = matchDetails?.date;
        if (!current || current === today) onChange("date", nextSaturday);
        didInit.current = true;
    }, []);

    return (
        <MatchBox title="Next Match">
            <MatchInfoRow label="Date" icon="📅">
                <input
                    type="date"
                    value={matchDetails.date || nextSaturday}
                    onChange={(e) => onChange("date", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="Start" icon="🕒">
                <input
                    type="time"
                    value={matchDetails.startTime}
                    onChange={(e) => onChange("startTime", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="End" icon="🕒">
                <input
                    type="time"
                    value={matchDetails.endTime}
                    onChange={(e) => onChange("endTime", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="Location" icon="📍">
                <select
                    value={matchDetails.location}
                    onChange={(e) => onChange("location", e.target.value)}
                >
                    {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                            {loc}
                        </option>
                    ))}
                </select>
            </MatchInfoRow>

            <MatchInfoRow label="Gap" icon="↔️">
                <GapControl value={matchDetails.gap} onChange={(v) => onChange("gap", v)} />
            </MatchInfoRow>

            {/* Section de génération sous le champ Gap */}
            <div className="generate-section">
                <div className="selected-counter">
                    <span className="selected-counter-number">{selectedCount}</span> / {totalCount} joueurs sélectionnés
                </div>
                <button
                    className="generate-button"
                    onClick={onGenerate}
                    disabled={disabled}
                >
                    Generate Teams
                </button>
            </div>
        </MatchBox>
    );
};

export default NextMatch;