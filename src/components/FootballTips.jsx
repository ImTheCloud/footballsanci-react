import React, { useEffect, useState } from "react";

export default function FootballTip() {
    const tips = [
        "Play with intensity and purpose so every action lifts the entire team's level.",
        "Scan constantly before receiving so your next decision is faster than pressure.",
        "Attack open spaces early to force defenders into choices they do not control.",
        "Keep your body shape ready so every touch moves you forward with confidence.",
        "Stay compact defensively so the team controls space instead of chasing it.",
        "Use your weaker foot boldly because unpredictability wins tight situations.",
        "Accelerate after passing to create overloads and stretch opponents out wide.",
        "Protect the ball smartly by using angles instead of relying only on strength.",
        "Press with intelligence so you cut passing lanes before the ball even arrives.",
        "Master your first touch because it decides whether you stay marked or escape.",
        "React instantly in transitions since the quickest players shape the outcome.",
        "Lead through effort and discipline so your consistency inspires teammates.",
        "Keep your head active so you anticipate danger before opponents even react.",
        "Play forward whenever possible so your team stays aggressive and unpredictable.",
        "Win midfield duels through positioning first, then through controlled intensity.",
        "Time your movements so runs create spaces instead of colliding with teammates.",
        "Stay patient in possession so you choose the best option, not the fastest one.",
        "Hold your defensive line with discipline to trap opponents facing the wrong way.",
        "Use clean body orientation so you stay open to both the ball and the next action.",
        "Communicate constantly because silent teams lose half a second on every play.",
        "Exploit weak sides by switching play quickly and forcing defenders to rotate.",
        "Recover your position fast after pressing so your structure stays unbroken.",
        "Attack crosses with conviction because hesitation kills goal opportunities.",
        "Protect central areas first so opponents are forced into predictable wide zones.",
        "Keep the ball moving at tempo to unbalance teams that defend in tight blocks.",
        "Stay brave in duels by controlling your approach instead of diving recklessly.",
        "Use double movements to lose markers and create separation before receiving.",
        "Stay focused after mistakes so you recover immediately instead of dwelling on it.",
        "Support teammates early so the ball carrier always has at least two options.",
        "Exploit transition moments instantly because defenses need time to reorganize.",
        "Stay calm under pressure and let technique guide your decisions, not panic.",
        "Close passing lanes with small steps so attackers lose rhythm and creativity."
    ];

    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % tips.length);
                setFade(true);
            }, 450);
        }, 5000);

        return () => clearInterval(interval);
    }, [tips.length]);

    const style = {
        marginTop: "40px",
        textAlign: "center",
        padding: "10px 20px",
        fontStyle: "italic",
        color: "white",
        fontSize: "var(--font-small)",
        lineHeight: "1.35",

        maxWidth: "85vw",
        marginLeft: "auto",
        marginRight: "auto",
        height: "2.7em",
        overflow: "hidden",

        opacity: fade ? 1 : 0,
        transform: fade ? "translateY(0px)" : "translateY(4px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",

        textShadow: fade
            ? "0 0 8px rgba(16,185,129,0.35), 0 0 12px rgba(16,185,129,0.25)"
            : "none"
    };

    return (
        <div style={style}>
            ⚽ {tips[index]}
        </div>
    );
}