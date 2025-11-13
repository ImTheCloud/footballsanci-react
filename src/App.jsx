import React from "react";
import { AuthProvider } from "./components/AuthContext.jsx";
import { SeasonProvider } from "./components/SeasonContext.jsx";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTopButton from "./components/ScrollToTopButton";

import Ranking from "./sections/Ranking/Ranking.jsx";
import Draw from "./sections/Draw/Draw.jsx";
import History from "./sections/History";

function App() {
    return (
        <AuthProvider>
            <SeasonProvider>

                <Header />

                <main >
                    <section id="ranking"><Ranking /></section>
                    <section id="draw"><Draw /></section>
                    <section id="history"><History /></section>
                </main>

                <Footer />

                <ScrollToTopButton />

            </SeasonProvider>
        </AuthProvider>
    );
}

export default App;