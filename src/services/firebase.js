// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Configuration Firebase (remplace par tes infos)
const firebaseConfig = {
    apiKey: "AIzaSyAsRvsb-_QY_JAVz2GaRWifR95aCRiddLA",
    authDomain: "footballsanci.firebaseapp.com",
    databaseURL: "https://footballsanci-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "footballsanci",
    storageBucket: "footballsanci.appspot.com",
    messagingSenderId: "108108129157",
    appId: "1:108108129157:web:c881c7b4d787677c43daec",
    measurementId: "G-VESXDYD12H",
};

// 🔹 Initialisation de l’app Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Export des services
export const auth = getAuth(app);       // Authentification
export const db = getFirestore(app);    // Firestore
export const storage = getStorage(app); // Storage