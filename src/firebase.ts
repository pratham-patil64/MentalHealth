// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- Add this
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFoGAk9O1Sl-Ji0PIwBIzFUB6OaGs4q0M",
  authDomain: "mindcare-d9183.firebaseapp.com",
  projectId: "mindcare-d9183",
  storageBucket: "mindcare-d9183.firebasestorage.app",
  messagingSenderId: "162276798485",
  appId: "1:162276798485:web:ec7d01787730788f79de1c",
  measurementId: "G-K5VGXGYTPG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app); // <-- Add this