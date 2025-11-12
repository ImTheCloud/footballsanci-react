import React, { useEffect, useMemo, useRef } from "react";
import "./LiveDraw.css";

// Available locations for matches. These are the values shown in the dropdown.
const LOCATIONS = ["Fit Five", "Halle"];
const GAP_STEP = 0.1;
const MIN_GAP = 0;

// ---- date helpers (local time) ----
// Pad a number to two digits with a leading zero when necessary.
const pad = (n) => String(n).padStart(2, "0");
// Convert a Date object into an ISO date string (YYYY-MM-DD).
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Get today's date in ISO format (in local time).
const getTodayISO = () => toISO(new Date());
// Compute the ISO date string for the next Saturday relative to today.
// If today is Saturday, it returns the Saturday of the following week.
const getNextSaturdayISO = () => {
    const t = new Date();
    const diff = ((6 - t.getDay()) % 7) || 7; // next Sat; if Sat -> +7
    const d = new Date(t);
    d.setDate(t.getDate() + diff);
    return toISO(d);
};

// ---- UI atoms ----
/**
 * A row in the match form. Includes an icon, a label and the field contents.
 * The icon prop allows us to customise the symbol displayed on the left of each row.
 */
const MatchInfoRow = ({ label, icon, children }) => (
    <div className="match-row">
        {icon && <span className="match-row-icon">{icon}</span>}
        <label>{label}:</label>
        {children}
    </div>
);

/**
 * A control to adjust the gap between team totals. Consists of a minus button,
 * a display of the current gap value, and a plus button. Values are constrained
 * between MIN_GAP and arbitrary upper limits using GAP_STEP increments.
 */
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

/**
 * A simple container for the match form, with a title and body section.
 */
const MatchBox = ({ title, children }) => (
    <div className="match-box">
        <h3 className="match-info-title">{title}</h3>
        <div className="match-section">{children}</div>
    </div>
);

// ---- main component ----
/**
 * LiveDraw collects match details from the user such as date, start/end times,
 * location and allowable gap between generated team totals. Icons accompany
 * each row to improve readability, and the gap control has been adjusted so
 * that the minus button aligns with other form fields and the value is centred.
 */
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
        </MatchBox>
    );
};

export default LiveDraw;