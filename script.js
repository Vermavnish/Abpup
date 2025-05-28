// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDw5IKZIiMvlvS1L8ofg6cKKMtXrVeN6zQ",
  authDomain: "avni-c6af6.firebaseapp.com",
  databaseURL: "https://avni-c6af6-default-rtdb.firebaseio.com",
  projectId: "avni-c6af6",
  storageBucket: "avni-c6af6.appspot.com",
  messagingSenderId: "158260273585",
  appId: "1:158260273585:web:06f310e48a87f404815d90",
  measurementId: "G-ZBNE463P71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();

// Login logic
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      document.getElementById("message").innerText = "Login successful!";
      console.log("Logged in:", userCredential.user);
      // Redirect or load dashboard
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
});

// Signup logic
document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      document.getElementById("message").innerText = "Signup successful!";
      console.log("Signed up:", userCredential.user);
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
});
