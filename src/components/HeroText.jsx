import React from "react";

function HeroText({ text }) {
    return (
        <div style={styles.container}>
            {text}
        </div>
    );
}

const styles = {
    container: {
        textAlign: "center",
        fontSize: "32px",
        fontWeight: "600",
        color: "white",
        paddingTop: "40px",
        paddingBottom: "10px",
        fontFamily: "'Rale way', sans-serif",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        opacity: 0.9,
    },
};

export default HeroText;