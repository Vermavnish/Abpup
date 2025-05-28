// js/auth.js

import { auth, db } from './firebase-init.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- User Authentication Logic ---
const signupForm = document.getElementById('userSignupForm');
const loginForm = document.getElementById('userLoginForm');
const signupMessage = document.getElementById('signupMessage');
const loginMessage = document.getElementById('loginMessage');
const logoutBtn = document.querySelector('.logout-btn');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = signupForm['signupUsername'].value;
        const email = signupForm['signupEmail'].value;
        const password = signupForm['signupPassword'].value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user data in Firestore (e.g., username)
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                isAdmin: false // Default to false for regular users
            });

            signupMessage.className = 'message success';
            signupMessage.textContent = 'Signup successful! Redirecting...';
            setTimeout(() => {
                window.location.href = 'user-home.html'; // Redirect to user home
            }, 1500);
        } catch (error) {
            signupMessage.className = 'message error';
            signupMessage.textContent = error.message;
            console.error("Signup error:", error);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['loginEmail'].value;
        const password = loginForm['loginPassword'].value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginMessage.className = 'message success';
            loginMessage.textContent = 'Login successful! Redirecting...';
            setTimeout(() => {
                window.location.href = 'user-home.html'; // Redirect to user home
            }, 1500);
        } catch (error) {
            loginMessage.className = 'message error';
            loginMessage.textContent = error.message;
            console.error("Login error:", error);
        }
    });
}

// --- Logout Functionality ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            alert('Logged out successfully!');
            // Redirect to a common login page or public page
            if (window.location.pathname.includes('admin')) {
                window.location.href = 'admin-login.html';
            } else {
                window.location.href = 'user-login.html';
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert('Error logging out: ' + error.message);
        }
    });
}

// --- Authentication State Listener (for page protection) ---
// This ensures that authenticated pages redirect if user is not logged in
// This needs to be called in every protected page's script (user.js, admin.js)
export function setupAuthProtection(redirectPath = 'user-login.html', isAdminCheck = false) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (isAdminCheck) {
                // For admin pages, check if the user is an admin
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    // User is logged in and is an admin
                    console.log("Admin logged in:", user.email);
                } else {
                    // User is logged in but not an admin, or admin flag is missing
                    alert('Access Denied: You are not authorized to view this page.');
                    await signOut(auth); // Log them out immediately
                    window.location.href = 'admin-login.html';
                }
            } else {
                // Regular user page, user is logged in
                console.log("User logged in:", user.email);
                // Optionally update UI for logged in user (e.g., display username)
            }
        } else {
            // No user is logged in
            console.log("No user logged in. Redirecting...");
            window.location.href = redirectPath;
        }
    });
}
