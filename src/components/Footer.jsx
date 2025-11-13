import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { LogOut } from "lucide-react";
import LoginModal from "./LoginModal.jsx";

function Footer() {
    const { currentUser, logout } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    return (
        <>
            <footer style={styles.footer}>
                <p style={styles.footerText}>
                    {currentUser ? (
                        <span
                            onClick={logout}
                            style={styles.logoutIcon}
                        >
                            <LogOut color="red" size={20} />
                        </span>
                    ) : (
                        <span
                            onClick={() => setShowLogin(true)}
                            style={styles.loginTrigger}
                        >
                            ©
                        </span>
                    )}
                    {" "}
                    {new Date().getFullYear()} FootballSanci. All rights reserved.
                </p>

                <p style={styles.creditLine}>
                    Made with ⚽ by Claudiu •{" "}
                    <a
                        href="https://github.com/ImTheCloud/footballsanci-react"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                    >
                        GitHub
                    </a>
                </p>
            </footer>

            <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
        </>
    );
}

const styles = {
    footer: {
        textAlign: "center",
        padding: "22px 0",
        background: "rgba(8,8,10,0.5)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        marginTop: "40px",
        position: "relative",
        zIndex: 1000,
    },
    footerText: {
        fontSize: "var(--font-small)",
        margin: 0,
        opacity: 0.85,
    },
    creditLine: {
        fontSize: "var(--font-very-small)",
        marginTop: "6px",
        opacity: 0.85,
    },
    link: {
        color: "#10B981",
        fontWeight: 600,
        textDecoration: "none",
    },
    loginTrigger: {
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "var(--font-normal)",
    },
    logoutIcon: {
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        top: "4px",
    },
};

export default Footer;