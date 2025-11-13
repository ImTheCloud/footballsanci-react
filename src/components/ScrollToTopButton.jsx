import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 300);
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            onClick={scrollTop}
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                border: "1px solid rgba(16, 185, 129, 0.5)",
                background: "rgba(8,8,10,0.6)",
                backdropFilter: "blur(10px)",
                color: "#10B981",
                display: visible ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2000,
                transition: "opacity 0.3s ease",
            }}
        >
            <ArrowUp size={22} />
        </button>
    );
}