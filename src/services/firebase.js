import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAsRvsb-_QY_JAVz2GaRWifR95aCRiddLA",
    authDomain: "footballsanci.firebaseapp.com",
    databaseURL: "https://footballsanci-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "footballsanci",
    storageBucket: "footballsanci.firebasestorage.app",
    messagingSenderId: "108108129157",
    appId: "1:108108129157:web:c881c7b4d787677c43daec",
    measurementId: "G-VESXDYD12H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 