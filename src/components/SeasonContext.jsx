import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

// Crée le contexte
const SeasonContext = createContext();

// Fournit le contexte à toute l’app
export function SeasonProvider({ children }) {
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [loadingSeasons, setLoadingSeasons] = useState(true);

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const snapshot = await getDocs(collection(db, "seasons"));
                const list = snapshot.docs.map((doc) => doc.id).sort();
                setSeasons(list);
                if (list.length > 0) setSelectedSeason(list[list.length - 1]);
            } catch (error) {
                console.error("Error loading seasons:", error);
            } finally {
                setLoadingSeasons(false);
            }
        };
        fetchSeasons();
    }, []);

    return (
        <SeasonContext.Provider value={{ seasons, selectedSeason, setSelectedSeason, loadingSeasons }}>
            {children}
        </SeasonContext.Provider>
    );
}


// eslint-disable-next-line react-refresh/only-export-components
export function useSeason() {
    return useContext(SeasonContext);
}
