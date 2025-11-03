import React from "react";
import "./BackgroundFx.css";

function BackgroundFx() {
    return (
        <div className="app-bg" aria-hidden="true">
            <div className="bg-dark"></div>
            <div className="bg-green-overlay"></div>
        </div>
    );
}

export default BackgroundFx;