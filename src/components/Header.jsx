import React, { useState, useEffect } from "react";
import { useSeason } from "./SeasonContext.jsx";

function Header() {
    const { seasons, selectedSeason, setSelectedSeason, loadingSeasons } = useSeason();
    const [activeSection, setActiveSection] = useState("ranking");

    const sections = ["ranking", "draw", "history"];

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const headerOffset = 80;
        const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        setActiveSection(id);
    };

    useEffect(() => {
        const onScroll = () => {
            const pos = window.scrollY + 80;
            for (let i = sections.length - 1; i >= 0; i--) {
                const s = document.getElementById(sections[i]);
                if (s && pos >= s.offsetTop) {
                    setActiveSection(sections[i]);
                    break;
                }
            }
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const getShortLabel = (season) => {
        const m = season?.match(/\d+/);
        return m ? `Season ${m[0]}` : season || "Season";
    };

    const seasonReady = !loadingSeasons && !!selectedSeason && seasons.length > 0;

    return (
        <header style={styles.header}>
            {/* LEFT: Season selector */}
            <div style={styles.left}>
                {seasonReady ? (
                    <select
                        style={styles.select}
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        {seasons.map((s) => (
                            <option key={s} value={s} style={styles.option}>
                                {getShortLabel(s)}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div style={styles.seasonPlaceholder}>
                        Season…
                    </div>
                )}
            </div>

            {/* RIGHT: Nav Buttons */}
            <nav style={styles.right}>
                {sections.map((sec) => (
                    <button
                        key={sec}
                        style={{
                            ...styles.navBtn,
                            ...(activeSection === sec ? styles.navBtnActive : {}),
                        }}
                        onClick={() => scrollTo(sec)}
                    >
                        {sec.charAt(0).toUpperCase() + sec.slice(1)}
                    </button>
                ))}
            </nav>
        </header>
    );
}

const styles = {
    header: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        color: "#fff",
        background: "rgba(8, 8, 10, 0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1000,
    },
    left: {
        display: "flex",
        alignItems: "center",
        paddingLeft: "10px",
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        paddingRight: "0.6rem",
    },

    /* SELECT (season) */
    select: {
        flex: "0 0 auto",
        width: "auto",
        color: "#fff",
        background: "transparent",
        border: "none",
        outline: "none",
        fontSize: "var(--font-normal)",
        fontWeight: 500,
        lineHeight: 1.2,
        cursor: "pointer",
        padding: "8px 22px 8px 6px",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 6\" fill=\"white\"><path d=\"M0 0l5 6 5-6H0z\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 6px center",
        backgroundSize: "10px 6px",
    },

    option: {
        color: "#000",
        backgroundColor: "#fff",
        fontSize: "var(--font-normal)",
    },

    seasonPlaceholder: {
        flex: "0 0 auto",
        padding: "8px 22px 8px 6px",
        fontSize: "var(--font-normal)",
        fontWeight: 500,
        lineHeight: 1.2,
        color: "#fff",
        whiteSpace: "nowrap",
    },

    /* NAV BUTTONS */
    navBtn: {
        background: "transparent",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        opacity: 0.8,
        letterSpacing: "0.5px",
        fontSize: "var(--font-normal)",
        fontWeight: 500,
        padding: "4px 6px",
        whiteSpace: "nowrap",
        transition: "opacity 0.2s ease, color 0.2s ease",
    },

    navBtnActive: {
        color: "#10B981",
        opacity: 1,
        fontWeight: 600,
    },
};

export default Header;