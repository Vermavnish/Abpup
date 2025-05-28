// firebase-config.js

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDw5IKZIiMvlvS1L8ofg6cKKMtXrVeN6zQ", // REPLACE WITH YOUR ACTUAL API KEY
  authDomain: "avni-c6af6.firebaseapp.com",
  projectId: "avni-c6af6",
  storageBucket: "avni-c6af6.firebasestorage.app",
  messagingSenderId: "158260273585",
  appId: "1:158260273585:web:06f310e48a87f404815d90",
  measurementId: "G-ZBNE463P71" // Optional
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Get the Auth service
const db = firebase.firestore(); // Get the Firestore service

// Export for use in other modules
export { app, auth, db };
