import React from "react";
import { SeasonProvider } from "./components/SeasonContext.jsx";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BackgroundFx from "./components/BackgroundFx";

import Ranking from "./sections/Ranking";
import History from "./sections/History";
import Statistics from "./sections/Statistics";
import Draw from "./sections/Draw";

function App() {
    return (
        <SeasonProvider>
            <BackgroundFx />
            <Header />
            <main style={{ position: "relative", zIndex: 1 }}>
                <section id="ranking"><Ranking /></section>
                <section id="history"><History /></section>
                <section id="draw"><Draw /></section>
                <section id="statistics"><Statistics /></section>
            </main>
            <Footer />
        </SeasonProvider>
    );
}

export default App;
