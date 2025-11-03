import React from "react";

function Section({ title, children }) {
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>{title}</h2>
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
    },
    title: {
        textAlign: "center",
        marginBottom: "30px",
    },
};

export default Section;