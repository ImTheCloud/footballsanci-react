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
        background: "#111",
        color: "#ccc",
        marginTop: "50px",
    },
};

export default Footer;