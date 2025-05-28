// script.js
import { onAuthStateChange, isAdmin } from './utils/auth.js';
import { renderLogin } from './components/login.js';
import { renderAdminDashboard } from './components/admin-dashboard.js';
import { renderStudentDashboard } from './components/student-dashboard.js';

const appContainer = document.getElementById('app');

// Function to render the appropriate dashboard or login page
function renderApp(user) {
    if (user) {
        if (isAdmin(user)) {
            renderAdminDashboard(appContainer);
        } else {
            renderStudentDashboard(appContainer);
        }
    } else {
        // No user logged in, show login page
        renderLogin(appContainer, (loggedInUser) => {
            // Callback after successful login, re-render app
            renderApp(loggedInUser);
        });
    }
}

// Listen for authentication state changes
onAuthStateChange(user => {
    console.log("Auth state changed. Current user:", user ? user.email : "None");
    renderApp(user);
});
