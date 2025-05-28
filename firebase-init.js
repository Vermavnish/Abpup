// js/firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkSFTP7cb4i-BzUFbvKNGCMXTCWMOc3gw",
  authDomain: "abptest3-595bb.firebaseapp.com",
  projectId: "abptest3-595bb",
  storageBucket: "abptest3-595bb.firebasestorage.app",
  messagingSenderId: "609413076048",
  appId: "1:609413076048:web:eb0acf7c57909660962d55",
  measurementId: "G-NG3GBECDEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Optional, for analytics
const auth = getAuth(app); // For authentication
const db = getFirestore(app); // For database operations (Firestore)

export { app, auth, db }; // Export them so other JS files can use them
