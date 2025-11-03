import React from "react";

function Footer() {
    return (
        <footer style={styles.footer}>
            <p>© {new Date().getFullYear()} FootballSanci. All rights reserved.</p>
        </footer>
    );
}

const styles = {
    footer: {
        textAlign: "center",
        padding: "20px 0",
        color: "#ccc",
        background: "rgba(10, 10, 10, 0.4)",
        backdropFilter: "blur(10px)",
        position: "relative",
        zIndex: 1,
    },
};

export default Footer;