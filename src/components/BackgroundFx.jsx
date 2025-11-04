import React from "react";

function BackgroundFx() {
    return (
        <>
            <style>
                {`
                .app-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none; /* Ne bloque pas les clics */
                    z-index: 0; /* Derrière tout le contenu */
                    overflow: hidden;
                }

                /* Fond noir de base */
                .bg-dark {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background-color: #0a0a0a; /* noir profond */
                }

                /* Nuances vert foncé en overlay */
                .bg-green-overlay {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 20% 30%, #064e3b, transparent 70%),
                                radial-gradient(circle at 80% 70%, #065f46, transparent 70%);
                    opacity: 0.4; /* ajuste l’intensité */
                }
                `}
            </style>

            <div className="app-bg" aria-hidden="true">
                <div className="bg-dark"></div>
                <div className="bg-green-overlay"></div>
            </div>
        </>
    );
}

export default BackgroundFx;