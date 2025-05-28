// firebase-init.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // For authentication
import { getFirestore } from "firebase/firestore"; // For database
import { getStorage } from "firebase/storage"; // For file storage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDw5IKZIiMvlvS1L8ofg6cKKMtXrVeN6zQ",
  authDomain: "avni-c6af6.firebaseapp.com",
  databaseURL: "https://avni-c6af6-default-rtdb.firebaseio.com", // You might primarily use Firestore, but Realtime DB is also available.
  projectId: "avni-c6af6",
  storageBucket: "avni-c6af6.firebasestorage.app",
  messagingSenderId: "158260273585",
  appId: "1:158260273585:web:06f310e48a87f404815d90",
  measurementId: "G-ZBNE463P71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);      // Initialize Auth service
const db = getFirestore(app);   // Initialize Firestore service
const storage = getStorage(app); // Initialize Storage service

// Export the initialized services for use in other files
export { app, analytics, auth, db, storage };
