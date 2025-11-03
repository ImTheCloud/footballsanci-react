import React from "react";

function Section({ title, children }) {
    return (
        <div style={styles.container}>
            {title && <h2 style={styles.title}>{title}</h2>}
            <div>{children}</div>
        </div>
    );
}

const styles = {
    container: {
        padding: "100px 20px",
        minHeight: "100vh",
        background: "transparent",
        color: "inherit",
        zIndex: 1,
        position: "relative",
    },
    title: {
        textAlign: "center",
        marginBottom: "30px",
    },
};

export default Section;