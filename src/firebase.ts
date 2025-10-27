// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <-- Import Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFoGAk9O1Sl-Ji0PIwBIzFUB6OaGs4q0M",
  authDomain: "mindcare-d9183.firebaseapp.com",
  projectId: "mindcare-d9183",
  storageBucket: "mindcare-d9183.appspot.com", // <-- Corrected storage bucket
  messagingSenderId: "162276798485",
  appId: "1:162276798485:web:ec7d01787730788f79de1c",
  measurementId: "G-K5VGXGYTPG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <-- Initialize and export Storage
