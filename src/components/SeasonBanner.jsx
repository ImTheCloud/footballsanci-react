import React, { useEffect, useState } from "react";
import { storage } from "../services/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { useSeason } from "./SeasonContext.jsx";

export default function SeasonBanner_Enhanced() {
    const { selectedSeason } = useSeason();
    const [imageUrl, setImageUrl] = useState(null);
    const [scrollY, setScrollY] = useState(0);
    const isMobile = window.innerWidth < 600;

    /* Resize listener */
    useEffect(() => {
        const onResize = () => window.innerWidth < 600;
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* Load season image */
    useEffect(() => {
        (async () => {
            try {
                const url = await getDownloadURL(ref(storage, `seasons/${selectedSeason}.jpg`));
                setImageUrl(url);
            } catch {
                setImageUrl(null);
            }
        })();
    }, [selectedSeason]);

    /* Parallax scroll */
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY / 4);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const bannerHeight = isMobile ? "140px" : "220px";

    return (
        <>
            <style>
                {`
                @keyframes fadeOnly {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                `}
            </style>

            <div style={{ ...css.container, height: bannerHeight }}>

                {/* Season image */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            ...css.image,
                            height: isMobile ? "150%" : "130%",
                            transform: `translateY(${scrollY}px)`
                        }}
                    />
                )}

                {/* Fallback Premium */}
                {!imageUrl && (
                    <div style={css.fallbackBox}>
                        <div style={css.icon}>⚽</div>
                        <div style={css.fallbackText}>No picture for this season</div>
                    </div>
                )}

                {/* Gradient fades */}
                <div style={{ ...css.fadeTop, height: isMobile ? "28%" : "40%" }} />
                <div style={{ ...css.fadeBottom, height: isMobile ? "20%" : "25%" }} />
            </div>
        </>
    );
}

/* -------------------------------------------
   CLEAN CSS-in-JS — uses your global font sizes
-------------------------------------------- */
const css = {
    container: {
        position: "relative",
        width: "100%",
        overflow: "hidden"
    },

    image: {
        width: "100%",
        objectFit: "cover",
        opacity: 0,
        animation: "fadeIn 0.7s forwards"
    },

    /* Fallback box */
    fallbackBox: {
        position: "absolute",
        bottom: "19px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "14px",
        padding: "10px 32px",
        minWidth: "max-content",
        borderRadius: "22px",
        backdropFilter: "blur(6px)",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.22)",
        animation: "fadeOnly 0.9s ease-out"
    },

    icon: {
        fontSize: "var(--font-large)",
        color: "white",
        filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))"
    },

    fallbackText: {
        color: "white",
        fontSize: "var(--font-large)",
        fontWeight: 800,
        letterSpacing: "0.04rem",
        textShadow: "0 4px 15px rgba(0,0,0,0.55)"
    },

    fadeTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)"
    },

    fadeBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)"
    }
};