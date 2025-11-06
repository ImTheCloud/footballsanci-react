import React, { useState, useEffect } from "react";
import { useSeason } from "./SeasonContext.jsx";

function Header() {
    const { seasons, selectedSeason, setSelectedSeason, loadingSeasons } = useSeason();
    const [activeSection, setActiveSection] = useState("ranking");

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80; // Hauteur de ton header
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }
        setActiveSection(id);
    };

    useEffect(() => {
        const sections = ["ranking", "history", "draw", "statistics"];
        const handleScroll = () => {
            const scrollPos = window.scrollY + 80; // offset pour le header
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = document.getElementById(sections[i]);
                if (section && scrollPos >= section.offsetTop) {
                    setActiveSection(sections[i]);
                    break;
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const getShortLabel = (season) => {
        const match = season.match(/\d+/);
        return match ? `S${match[0]}` : season;
    };

    return (
        <header style={styles.header}>
            <div style={styles.leftContainer}>
                <div style={styles.customSelectLabel}>{getShortLabel(selectedSeason)}</div>
                <select
                    style={styles.select}
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    disabled={loadingSeasons}
                >
                    {seasons.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>

                {["ranking", "history", "draw", "statistics"].map((sec) => (
                    <button
                        key={sec}
                        style={{
                            ...styles.navBtn,
                            ...(activeSection === sec ? styles.activeNavBtn : {}),
                        }}
                        onClick={() => scrollTo(sec)}
                    >
                        {sec.charAt(0).toUpperCase() + sec.slice(1)}
                    </button>
                ))}
            </div>
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
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "12px 0",
        color: "#fff",
        background: "rgba(8, 8, 10, 0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1000,
    },
    leftContainer: {
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        margin: 0,
        padding: 0,
        position: "relative",
    },
    customSelectLabel: {
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        color: "#fff",
        fontSize: "clamp(1.05rem, 2.4vw, 1.15rem)",
        fontWeight: 500,
        userSelect: "none",
        zIndex: 10,
    },
    select: {
        background: "transparent",
        color: "transparent",
        border: "none",
        borderRadius: "8px",
        padding: "12px 0px 12px 0px",
        fontSize: "clamp(1.05rem, 2.4vw, 1.15rem)",
        fontWeight: 500,
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 6\" fill=\"white\"><path d=\"M0 0l5 6 5-6H0z\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left 40px center",
        backgroundSize: "10px 6px",
        transition: "opacity 0.2s ease",
    },
    navBtn: {
        background: "transparent",
        border: "none",
        color: "#fff",
        letterSpacing: "0.5px",
        cursor: "pointer",
        transition: "color 0.2s ease, opacity 0.2s ease",
        opacity: 0.8,
        minWidth: "22px",
        fontSize: "clamp(1.05rem, 2.4vw, 1.15rem)",
        fontWeight: 500,
        padding: "4px 6px",
        whiteSpace: "nowrap",
        textDecoration: "none",
    },
    activeNavBtn: {
        color: "#10B981",
        opacity: 1,
        fontWeight: 600,
    },
};

export default Header;