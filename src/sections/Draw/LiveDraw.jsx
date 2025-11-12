import React, { useEffect, useMemo, useRef } from "react";
import "./LiveDraw.css";

const LOCATIONS = ["Fit Five", "Halle"];
const GAP_STEP = 0.1;
const MIN_GAP = 0;

// ---- date helpers (local time) ----
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getTodayISO = () => toISO(new Date());
const getNextSaturdayISO = () => {
    const t = new Date();
    const diff = ((6 - t.getDay()) % 7) || 7; // next Sat; if Sat -> +7
    const d = new Date(t);
    d.setDate(t.getDate() + diff);
    return toISO(d);
};

// ---- UI atoms ----
const MatchInfoRow = ({ label, children }) => (
    <div className="match-row">
        <label>{label}:</label>
        {children}
    </div>
);

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

const MatchBox = ({ title, children }) => (
    <div className="match-box">
        <h3 className="match-info-title">{title}</h3>
        <div className="match-section">{children}</div>
    </div>
);

// ---- main component ----
const LiveDraw = ({ matchDetails, onChange }) => {
    const nextSaturday = useMemo(getNextSaturdayISO, []);
    const today = useMemo(getTodayISO, []);
    const didInit = useRef(false);

    // Set default to next Saturday once on mount (if empty or today)
    useEffect(() => {
        if (didInit.current) return;
        const current = matchDetails?.date;
        if (!current || current === today) onChange("date", nextSaturday);
        didInit.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <MatchBox title="Live Draw">
            <MatchInfoRow label="Date">
                <input
                    type="date"
                    value={matchDetails.date || nextSaturday}
                    onChange={(e) => onChange("date", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="Start">
                <input
                    type="time"
                    value={matchDetails.startTime}
                    onChange={(e) => onChange("startTime", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="End">
                <input
                    type="time"
                    value={matchDetails.endTime}
                    onChange={(e) => onChange("endTime", e.target.value)}
                />
            </MatchInfoRow>

            <MatchInfoRow label="Location">
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

            <MatchInfoRow label="Gap">
                <GapControl value={matchDetails.gap} onChange={(v) => onChange("gap", v)} />
            </MatchInfoRow>
        </MatchBox>
    );
};

export default LiveDraw;