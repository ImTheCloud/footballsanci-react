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
            {/* Season Selector à gauche */}
            <div style={{ display: "flex", alignItems: "center", paddingLeft: 0, marginLeft: 0 }}>
                <div style={{ position: "relative" }}>
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
                </div>
            </div>

            {/* Navigation à droite */}
            <nav style={styles.nav}>
                {["ranking", "history", "statistics", "draw"].map((sec) => (
                    <button
                        key={sec}
                        style={{
                            ...styles.navBtn,
                            gap: "clamp(8px, 2vw, 18px)",
                            fontSize: "clamp(0.9rem, 2.2vw, 1.8rem)",
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
        padding: "12px 0px", // pas de padding gauche/droite
        paddingInline: "10px",
        color: "#fff",
        background: "rgba(8, 8, 10, 0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1000,
    },
    select: {
        marginLeft: "0px",
        marginRight: "20px",
        background: "transparent",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 35px 8px 15px",
        fontSize: "1.1rem",
        fontWeight: 500,
        outline: "none",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        position: "relative",
        backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 6\" fill=\"white\"><path d=\"M0 0l5 6 5-6H0z\"/></svg>')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        backgroundSize: "10px 6px",
        transition: "opacity 0.2s ease",
    },
    nav: {
        display: "flex",
        gap: "clamp(8px, 2vw, 18px)",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        paddingRight: "20px",
        scrollPaddingRight: "20px",
        whiteSpace: "nowrap",
    },
    navBtn: {
        background: "transparent",
        border: "none",
        color: "#fff",
        letterSpacing: "0.5px",
        cursor: "pointer",
        transition: "color 0.2s ease, opacity 0.2s ease",
        opacity: 0.8,
        flexShrink: 0,
        fontSize: "clamp(0.9rem, 2.2vw, 1.8rem)",
    },
    activeNavBtn: {
        color: "#10B981",
        opacity: 1,
        fontWeight: 600,
    },
};

export default Header;