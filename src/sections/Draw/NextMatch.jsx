import React, { useEffect, useMemo, useRef } from "react";
import "./styles/NextMatch.css";

const LOCATIONS = ["Fit Five", "Halle","Veeweyde"];
const GAPLIMIT_STEP = 0.1;
const MIN_GAPLIMIT = 0;

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const getTodayISO = () => toISO(new Date());
const getNextSaturdayISO = () => {
    const t = new Date();
    const day = t.getDay();

    // If today is Saturday (6), use today's date
    if (day === 6) {
        return toISO(t);
    }

    // Otherwise, go to the upcoming Saturday of this week
    const diff = 6 - day; // 0–6 days ahead
    const d = new Date(t);
    d.setDate(t.getDate() + diff);
    return toISO(d);
};

const MatchInfoRow = ({ label, icon, children }) => (
    <div className="match-row">
        {icon && <span className="match-row-icon">{icon}</span>}
        <label>{label}:</label>
        {children}
    </div>
);

const GapLimitControl = ({ value, onChange }) => (
    <div className="gapLimit-control">
        <button
            type="button"
            aria-label="Decrease gapLimit"
            onClick={() => {
                const num = Number(value) || 0;
                onChange(Math.max(MIN_GAPLIMIT, +((num - GAPLIMIT_STEP).toFixed(2))));
            }}
        >
            −
        </button>
        <span>{Number(value).toFixed(2)}</span>
        <button
            type="button"
            aria-label="Increase gapLimit"
            onClick={() => {
                const num = Number(value) || 0;
                onChange(+((num + GAPLIMIT_STEP).toFixed(2)));
            }}
        >
            +
        </button>
    </div>
);

const MatchBox = ({ title, children }) => (
    <div className="match-box">
        {title && (
            <h3 className="section-title section-title--compact">
                {title}
            </h3>
        )}
        <div className="match-section">{children}</div>
    </div>
);

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
    }, [matchDetails, today, nextSaturday, onChange]);

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

            <MatchInfoRow label="Gap limit" icon="↔️">
                <GapLimitControl
                    value={matchDetails.gapLimit}
                    onChange={(v) => onChange("gapLimit", v)}
                />
            </MatchInfoRow>

            <div className="generate-section">
                <div className="selected-counter">
                    <span className="selected-counter-number">
                        {selectedCount}
                    </span>{" "}
                    / {totalCount} selected players
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