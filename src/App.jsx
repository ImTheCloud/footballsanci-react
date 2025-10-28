import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Ranking from "./sections/Ranking";
import History from "./sections/History";
import Statistics from "./sections/Statistics";
import Draw from "./sections/Draw";

function App() {
    return (
        <>
            <Header />
            <main>
                <section id="ranking"><Ranking /></section>
                <section id="history"><History /></section>
                <section id="statistics"><Statistics /></section>
                <section id="draw"><Draw /></section>
            </main>
            <Footer />
        </>
    );
}

export default App;