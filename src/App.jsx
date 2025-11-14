import React from "react";
import { AuthProvider } from "./components/AuthContext.jsx";
import { SeasonProvider } from "./components/SeasonContext.jsx";

import Header from "./components/Header";
import Footer from "./components/Footer";
import SeasonBanner from "./components/SeasonBanner.jsx";

import Ranking from "./sections/Ranking/Ranking.jsx";
import Draw from "./sections/Draw/Draw.jsx";
import History from "./sections/History";

import FootballTips from "./components/FootballTips.jsx";

function App() {
    return (
        <AuthProvider>
            <SeasonProvider>

                <Header />
                <SeasonBanner />

                <main style={{ position: "relative", zIndex: 1 }}>
                    <section id="ranking"><Ranking /></section>
                    <section id="draw"><Draw /></section>
                    <section id="history"><History /></section>

                    <section id="football-tips">
                        <FootballTips />
                    </section>
                </main>

                <Footer />

            </SeasonProvider>
        </AuthProvider>
    );
}

export default App;