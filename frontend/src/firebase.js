import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCUNDXifqscU8oL8yjmjLUdymR3rra46x4",
    authDomain: "drivetrust-da1c7.firebaseapp.com",
    projectId: "drivetrust-da1c7",
    storageBucket: "drivetrust-da1c7.firebasestorage.app",
    messagingSenderId: "585518672711",
    appId: "1:585518672711:web:25d54fc3f31b08fa367a62",
    measurementId: "G-LGY1PE9MPX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
