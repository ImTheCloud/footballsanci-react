import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { LogOut } from "lucide-react";

function Footer() {
    const { currentUser, login, logout } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            setShowLogin(false);
            setEmail("");
            setPassword("");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleClose = () => {
        setShowLogin(false);
        setEmail("");
        setPassword("");
        setError("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && email && password && !loading) handleLogin();
    };

    return (
        <>
            <footer style={styles.footer}>
                <p>
                    {currentUser ? (
                        <span
                            onClick={handleLogout}
                            style={styles.logoutIcon}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogout()}
                        >
                            <LogOut color="red" size={20} />
                        </span>
                    ) : (
                        <span
                            onClick={() => setShowLogin(true)}
                            style={styles.copyright}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && setShowLogin(true)}
                        >
                            ©
                        </span>
                    )}
                    {" "}{new Date().getFullYear()} FootballSanci. All rights reserved.
                </p>
            </footer>

            {showLogin && (
                <div style={styles.overlay} onClick={handleClose}>
                    <div
                        style={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            style={styles.closeButton}
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div style={styles.modalHeader}>
                            <h2 style={styles.title}>Login</h2>
                            <p style={styles.subtitle}>
                                Welcome 👋 Please log in to continue.
                            </p>
                        </div>

                        <div style={styles.formContainer}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label} htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    style={styles.input}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label} htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    style={styles.input}
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div style={styles.error}>
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleLogin}
                                disabled={loading || !email || !password}
                                style={{
                                    ...styles.submitButton,
                                    ...(loading || !email || !password ? styles.submitButtonDisabled : {})
                                }}
                            >
                                {loading ? "Logging in..." : "Log in"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
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
    copyright: {
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        transition: "all 0.3s ease",
        display: "inline-block",
        fontWeight: "600",
    },
    logoutIcon: {
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 4px",
        borderRadius: "4px",
        transition: "all 0.2s ease",
    },
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease",
    },
    modal: {
        background: "rgba(10, 10, 10, 0.95)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "12px",
        padding: "32px",
        width: "90%",
        maxWidth: "420px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 40px rgba(16, 185, 129, 0.2)",
        position: "relative",
        animation: "slideUp 0.3s ease",
    },
    closeButton: {
        position: "absolute",
        top: "16px",
        right: "16px",
        background: "transparent",
        border: "none",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "24px",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "4px",
        transition: "all 0.2s ease",
        lineHeight: 1,
    },
    modalHeader: {
        marginBottom: "28px",
        textAlign: "center",
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#fff",
        margin: "0 0 12px 0",
        textTransform: "uppercase",
        letterSpacing: "1px",
    },
    subtitle: {
        fontSize: "15px",
        color: "rgba(255, 255, 255, 0.7)",
        margin: 0,
    },
    formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "rgba(16, 185, 129, 1)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        background: "rgba(6, 78, 59, 0.15)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "15px",
        color: "#fff",
        outline: "none",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    error: {
        background: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "rgba(239, 68, 68, 1)",
        fontSize: "14px",
        textAlign: "center",
    },
    submitButton: {
        marginTop: "8px",
        padding: "14px 24px",
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 78, 59, 0.4))",
        border: "2px solid rgba(16, 185, 129, 0.5)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s ease",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)",
    },
    submitButtonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
};

export default Footer;