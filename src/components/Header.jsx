import React, { useState, useEffect } from "react";
import { useSeason } from "./SeasonContext.jsx";

function Header() {
    const { seasons, selectedSeason, setSelectedSeason, loadingSeasons } = useSeason();
    const [activeSection, setActiveSection] = useState("ranking");

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
        setActiveSection(id);
    };

    // Detect scroll to highlight current section
    useEffect(() => {
        const sections = ["ranking", "history", "statistics", "draw"];
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

    return (
        <header style={styles.header}>
            {/* Season Selector */}
            <select
                style={styles.select}
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={loadingSeasons}
            >
                {seasons.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {/* Navigation */}
            <nav style={styles.nav}>
                {["ranking", "history", "statistics", "draw"].map((sec) => (
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
        padding: "12px 30px",
        color: "#fff",
        background: "rgba(8, 8, 10, 0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1000,
    },
    select: {
        marginLeft: "0",
        background: "transparent",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 24px 8px 8px",
        fontSize: "1rem",
        fontWeight: 500,
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        position: "relative",
        backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"10\" viewBox=\"0 0 10 10\" width=\"10\" xmlns=\"http://www.w3.org/2000/svg\"><polygon points=\"0,0 10,0 5,5\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        backgroundSize: "10px",
        transition: "opacity 0.2s ease",
    },
    nav: {
        display: "flex",
        gap: "18px",
    },
    navBtn: {
        background: "transparent",
        border: "none",
        color: "#fff",
        letterSpacing: "0.5px",
        cursor: "pointer",
        transition: "color 0.2s ease, opacity 0.2s ease",
        opacity: 0.8,
    },
    activeNavBtn: {
        color: "#10B981", // vert clair pour indiquer la section active
        opacity: 1,
        fontWeight: 600,
    },
};

export default Header;