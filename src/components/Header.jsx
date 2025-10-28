import React from "react";

function Header() {
    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <header style={styles.header}>
            <h1 style={styles.logo}>⚽ Football Sanci</h1>
            <nav style={styles.nav}>
                <button onClick={() => scrollTo("ranking")}>Ranking</button>
                <button onClick={() => scrollTo("history")}>Match History</button>
                <button onClick={() => scrollTo("statistics")}>Statistics</button>
                <button onClick={() => scrollTo("draw")}>Draw</button>
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
        background: "#222",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        zIndex: 1000,
    },
    logo: {
        fontSize: "1.2rem",
    },
    nav: {
        display: "flex",
        gap: "15px",
    },
};

export default Header;