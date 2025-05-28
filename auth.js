// auth.js

import { auth, db } from './firebase-init.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- User/Admin Registration ---
export async function registerUser(email, password, displayName, role = 'student') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: role, // 'student' or 'admin'
            createdAt: new Date()
        });

        console.log("User registered and data saved:", user);
        return user;
    } catch (error) {
        console.error("Error registering user:", error.message);
        throw error; // Re-throw to handle in UI
    }
}

// --- User/Admin Login ---
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // You might want to fetch user role here if needed immediately after login
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            console.log("User logged in:", user.email, "Role:", userDoc.data().role);
            return userDoc.data(); // Return user data including role
        } else {
            console.warn("User data not found in Firestore for:", user.uid);
            return null; // Or throw an error if user data must exist
        }
    } catch (error) {
        console.error("Error logging in user:", error.message);
        throw error;
    }
}

// --- User/Admin Logout ---
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User logged out.");
    } catch (error) {
        console.error("Error logging out user:", error.message);
        throw error;
    }
}

// --- Password Reset ---
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("Password reset email sent to:", email);
        return true;
    } catch (error) {
        console.error("Error sending password reset email:", error.message);
        throw error;
    }
}

// --- Auth State Listener ---
// Use this to check if a user is logged in and redirect accordingly
export function setupAuthListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in, fetch their role from Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                callback({ ...user, role: userData.role }); // Augment user object with role
            } else {
                console.warn("User data not found in Firestore for UID:", user.uid);
                callback(user); // Return basic user object if data not found
            }
        } else {
            // User is logged out
            callback(null);
        }
    });
}

// Function to check if a user is an admin
export async function isAdmin(uid) {
    if (!uid) return false;
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
