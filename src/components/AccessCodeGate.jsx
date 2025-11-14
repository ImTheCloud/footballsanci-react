import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

// Bump this key when you want to force all devices to enter the access code again
const ACCESS_KEY = "fs_access_code_ok_v3";

async function hashCode(value) {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AccessCodeGate() {
    const [visible, setVisible] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [expectedHash, setExpectedHash] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            // Local access gate: show the modal if we do not have the local flag
            try {
                const stored = localStorage.getItem(ACCESS_KEY);
                if (!stored) {
                    setVisible(true);
                }
            } catch {
                setVisible(true);
            }

            // Fetch expected hash from Firestore
            try {
                const snap = await getDoc(doc(db, "access", "hash"));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data && data.hash) {
                        setExpectedHash(String(data.hash));
                    } else if (data && data.code) {
                        // Fallback: if a plain code is stored, hash it once on the client
                        const hashed = await hashCode(String(data.code));
                        setExpectedHash(hashed);
                    }
                } else {
                    console.error("Access code document not found in Firestore");
                }
            } catch (err) {
                console.error("Error fetching access code from Firestore", err);
            } finally {
                setConfigLoading(false);
            }
        };

        init();
    }, []);

    if (!visible) return null;

    const handleSubmit = async () => {
        setError("");

        if (!code) return;
        if (!expectedHash) {
            setError("Access configuration is not available. Please try again later.");
            return;
        }

        setLoading(true);
        try {
            const enteredHash = await hashCode(code);
            if (enteredHash === expectedHash) {
                try {
                    localStorage.setItem(ACCESS_KEY, "true");
                } catch {
                    // If localStorage is not available, still allow access
                }
                setVisible(false);
                setCode("");
                setError("");
            } else {
                setError("Incorrect code. Please contact the manager.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && code && !loading && !configLoading) {
            handleSubmit();
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.title}>Team Access</h2>
                    <p style={styles.subtitle}>
                        Enter the access code to view rankings and matches.
                    </p>
                </div>

                <div style={styles.formContainer}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="access-code">
                            Access code
                        </label>
                        <input
                            id="access-code"
                            type="password"
                            inputMode="numeric"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={styles.input}
                            placeholder="••••"
                        />
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !code || configLoading}
                        style={{
                            ...styles.submitButton,
                            ...(loading || !code || configLoading
                                ? styles.submitButtonDisabled
                                : {}),
                        }}
                    >
                        {configLoading
                            ? "Loading access..."
                            : loading
                            ? "Checking..."
                            : "Enter"}
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
        backgroundColor: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2500,
    },
    modal: {
        background: "rgba(10,10,10,0.96)",
        border: "1px solid rgba(16, 185, 129, 0.4)",
        borderRadius: "12px",
        padding: "32px",
        width: "92%",
        maxWidth: "420px",
        boxShadow: "0 0 40px rgba(16,185,129,0.35)",
        position: "relative",
    },
    modalHeader: { marginBottom: "22px", textAlign: "center" },
    title: {
        fontSize: "var(--font-large)",
        fontWeight: 700,
        color: "#fff",
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "1px",
    },
    subtitle: {
        margin: "8px 0 0",
        fontSize: "var(--font-small)",
        color: "rgba(255,255,255,0.7)",
    },
    formContainer: { display: "flex", flexDirection: "column", gap: "16px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: {
        fontSize: "var(--font-small)",
        color: "rgba(16,185,129,1)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        background: "rgba(6,78,59,0.20)",
        border: "1px solid rgba(16,185,129,0.4)",
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
        padding: "10px 14px",
        color: "rgba(239,68,68,1)",
        fontSize: "var(--font-small)",
        textAlign: "center",
    },
    submitButton: {
        marginTop: "4px",
        padding: "14px 24px",
        background: "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(6,78,59,0.6))",
        border: "2px solid rgba(16,185,129,0.7)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "var(--font-normal)",
        fontWeight: 700,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
    },
    submitButtonDisabled: { opacity: 0.5, cursor: "not-allowed" },
};