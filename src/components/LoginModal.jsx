import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function LoginModal({ visible, onClose }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!visible) return null;

    const handleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            onClose();
            setEmail("");
            setPassword("");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && email && password && !loading) handleLogin();
    };

    const closeAndReset = () => {
        onClose();
        setEmail("");
        setPassword("");
        setError("");
    };

    return (
        <div style={styles.overlay} onClick={closeAndReset}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={closeAndReset}>
                    ✕
                </button>

                <div style={styles.modalHeader}>
                    <h2 style={styles.title}>Login</h2>
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

                    {error && <div style={styles.error}>{error}</div>}

                    <button
                        onClick={handleLogin}
                        disabled={loading || !email || !password}
                        style={{
                            ...styles.submitButton,
                            ...(loading || !email || !password
                                ? styles.submitButtonDisabled
                                : {}),
                        }}
                    >
                        {loading ? "Logging in..." : "Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
    },
    modal: {
        background: "rgba(10,10,10,0.95)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        borderRadius: "12px",
        padding: "32px",
        width: "92%",
        maxWidth: "420px",
        boxShadow: "0 0 40px rgba(16,185,129,0.25)",
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: "16px",
        right: "16px",
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.6)",
        fontSize: "22px",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "4px",
    },
    modalHeader: { marginBottom: "26px", textAlign: "center" },
    title: {
        fontSize: "var(--font-large)",
        fontWeight: 700,
        color: "#fff",
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "1px",
    },
    formContainer: { display: "flex", flexDirection: "column", gap: "18px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: {
        fontSize: "var(--font-small)",
        color: "rgba(16,185,129,1)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        background: "rgba(6,78,59,0.15)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "var(--font-normal)",
        color: "#fff",
        outline: "none",
    },
    error: {
        background: "rgba(239,68,68,0.15)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "rgba(239,68,68,1)",
        fontSize: "var(--font-small)",
        textAlign: "center",
    },
    submitButton: {
        marginTop: "6px",
        padding: "14px 24px",
        background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,78,59,0.4))",
        border: "2px solid rgba(16,185,129,0.5)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "var(--font-normal)",
        fontWeight: 700,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        boxShadow: "0 4px 15px rgba(16,185,129,0.2)",
    },
    submitButtonDisabled: { opacity: 0.5, cursor: "not-allowed" },
};