// utils/auth.js
import { auth } from '../firebase-config.js';

const ADMIN_EMAIL = 'admin@abp.com';

/**
 * Handles user login.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User object if successful, throws error otherwise.
 */
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Login Error:", error.message);
        throw error;
    }
}

/**
 * Handles user logout.
 */
async function logoutUser() {
    try {
        await auth.signOut();
        console.log("User logged out.");
    } catch (error) {
        console.error("Logout Error:", error.message);
        throw error;
    }
}

/**
 * Checks if the current authenticated user is the admin.
 * @param {Object} user - The Firebase User object.
 * @returns {boolean} True if the user is the admin, false otherwise.
 */
function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
}

/**
 * Sets up an authentication state observer.
 * @param {Function} callback - Function to call with the current user object.
 */
function onAuthStateChange(callback) {
    auth.onAuthStateChanged(callback);
}

export { loginUser, logoutUser, isAdmin, onAuthStateChange, ADMIN_EMAIL };
