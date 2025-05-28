// user.js

import { loginUser, logoutUser, setupAuthListener, resetPassword, registerUser } from './auth.js';
import { db } from './firebase-init.js';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

// --- DOM Elements ---
const userLoginForm = document.getElementById('userLoginForm');
const loginMessage = document.getElementById('loginMessage');
const loginButton = document.getElementById('loginButton');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const registerLink = document.getElementById('registerLink');

const userDisplayNameSpan = document.getElementById('userDisplayName');
const logoutButton = document.getElementById('logoutButton');
const enrolledBatchesList = document.getElementById('enrolledBatchesList');
const upcomingClassesList = document.getElementById('upcomingClassesList');
const announcementsList = document.getElementById('announcementsList');

const registrationForm = document.getElementById('registrationForm'); // For a separate registration page
const registrationMessage = document.getElementById('registrationMessage');


// --- Helper for messages ---
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

function clearMessage(element) {
    element.textContent = '';
    element.className = 'message';
    element.style.display = 'none';
}

// --- Login Page Logic (`user-login.html`) ---
if (userLoginForm) {
    userLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(loginMessage);
        loginButton.disabled = true;

        const email = userLoginForm['email'].value;
        const password = userLoginForm['password'].value;

        try {
            const userData = await loginUser(email, password);
            if (userData.role === 'student') {
                window.location.href = 'user-home.html';
            } else {
                // If an admin tries to login through user login, log them out
                // or show an error and redirect to admin login.
                await logoutUser(); // Log out the admin if they tried to login here
                displayMessage(loginMessage, "Access Denied: Please use the admin login page.", "error");
            }
        } catch (error) {
            let errorMessage = "Login failed. Please check your credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            }
            displayMessage(loginMessage, errorMessage, "error");
        } finally {
            loginButton.disabled = false;
        }
    });

    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt("Please enter your email to reset password:");
        if (email) {
            try {
                await resetPassword(email);
                alert("Password reset email sent. Please check your inbox.");
            } catch (error) {
                alert(`Failed to send reset email: ${error.message}`);
            }
        }
    });

   /* registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirect to a dedicated registration page if you have one, or show a modal
        // For simplicity, let's assume a conceptual 'user-register.html'
        alert("Registration is currently handled by admin or needs a 'user-register.html' page.");
        // window.location.href = 'user-register.html'; // Uncomment if you create this page
    });*/
}

// --- User Home Page Logic (`user-home.html`) ---
if (userDisplayNameSpan && logoutButton) {
    setupAuthListener(async (user) => {
        if (user && user.role === 'student') {
            userDisplayNameSpan.textContent = user.displayName || user.email;
            await loadUserDashboardData(user.uid);
        } else {
            // Not a student or logged out, redirect to login
            window.location.href = 'user-login.html';
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await logoutUser();
            window.location.href = 'user-login.html';
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. Please try again.");
        }
    });

    async function loadUserDashboardData(uid) {
        try {
            // Fetch user's enrolled batches
            const userDocRef = doc(db, "users", uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const enrolledBatchIds = userData.enrolledBatches || [];

                if (enrolledBatchIds.length > 0) {
                    const batchesQuery = query(collection(db, "batches"), where("id", "in", enrolledBatchIds)); // Assuming batch 'id' is stored
                    const batchDocs = await getDocs(batchesQuery);
                    enrolledBatchesList.innerHTML = ''; // Clear previous content
                    batchDocs.forEach(batchDoc => {
                        const batch = batchDoc.data();
                        const batchItem = document.createElement('div');
                        batchItem.className = 'batch-card';
                        batchItem.innerHTML = `
                            <div>
                                <h4>${batch.name}</h4>
                                <p>Course: ${batch.courseName || 'N/A'}</p>
                                <p>Instructor: ${batch.instructor || 'N/A'}</p>
                                <p>Start Date: ${new Date(batch.startDate.seconds * 1000).toLocaleDateString()}</p>
                            </div>
                            <button onclick="window.location.href='user-my-batches.html?batchId=${batch.id}'">View Batch</button>
                        `;
                        enrolledBatchesList.appendChild(batchItem);
                    });
                } else {
                    enrolledBatchesList.innerHTML = '<p>You are not currently enrolled in any batches. Explore our courses!</p>';
                }

                // Fetch recent announcements for students (or specific batches)
                const announcementsQuery = query(
                    collection(db, "announcements"),
                    where("targetAudience", "in", ["all", "students"]), // Or specific batch IDs
                    // orderBy("createdAt", "desc"), // Requires index in Firebase
                    // limit(5) // Requires index in Firebase
                );
                const announcementDocs = await getDocs(announcementsQuery);
                announcementsList.innerHTML = '';
                if (!announcementDocs.empty) {
                    announcementDocs.forEach(doc => {
                        const announcement = doc.data();
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${announcement.title}</strong>: ${announcement.content} <small>(${new Date(announcement.createdAt.seconds * 1000).toLocaleDateString()})</small>`;
                        announcementsList.appendChild(li);
                    });
                } else {
                    announcementsList.innerHTML = '<p>No new announcements.</p>';
                }

                // Placeholder for Upcoming Classes (you'd need a `schedule` or `lessons` collection)
                upcomingClassesList.innerHTML = '<p>No upcoming classes scheduled yet.</p>';


            } else {
                console.error("User document not found for:", uid);
                // Handle case where user auth exists but Firestore doc is missing
                await logoutUser(); // Log them out
            }
        } catch (error) {
            console.error("Error loading user dashboard data:", error);
            enrolledBatchesList.innerHTML = '<p class="error">Error loading batches.</p>';
            announcementsList.innerHTML = '<p class="error">Error loading announcements.</p>';
        }
    }
}

// --- My Batches Page Logic (`user-my-batches.html`) ---
const batchDetailsContainer = document.getElementById('batchDetailsContainer');

if (batchDetailsContainer) {
    setupAuthListener(async (user) => {
        if (user && user.role === 'student') {
            const urlParams = new URLSearchParams(window.location.search);
            const batchId = urlParams.get('batchId');

            if (batchId) {
                await loadBatchDetails(batchId, user.uid);
            } else {
                batchDetailsContainer.innerHTML = '<p class="error">No batch selected. Please go to <a href="user-home.html">User Home</a> to select a batch.</p>';
            }
        } else {
            window.location.href = 'user-login.html';
        }
    });

    async function loadBatchDetails(batchId, userId) {
        try {
            const batchDocRef = doc(db, "batches", batchId);
            const batchDocSnap = await getDoc(batchDocRef);

            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);

            if (!batchDocSnap.exists()) {
                batchDetailsContainer.innerHTML = '<p class="error">Batch not found.</p>';
                return;
            }

            const batchData = batchDocSnap.data();
            const userData = userDocSnap.data();

            // Basic check if user is enrolled (more robust check with security rules)
            if (!userData || !userData.enrolledBatches || !userData.enrolledBatches.includes(batchId)) {
                batchDetailsContainer.innerHTML = '<p class="error">You are not enrolled in this batch.</p>';
                return;
            }

            batchDetailsContainer.innerHTML = `
                <h2>${batchData.name}</h2>
                <p><strong>Course:</strong> ${batchData.courseName || 'N/A'}</p>
                <p><strong>Instructor:</strong> ${batchData.instructor || 'N/A'}</p>
                <p><strong>Start Date:</strong> ${new Date(batchData.startDate.seconds * 1000).toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${batchData.description || 'No description provided.'}</p>

                <h3>Study Materials</h3>
                <ul id="studyMaterialsList">
                    </ul>

                <h3>Assignments</h3>
                <ul id="assignmentsList">
                    </ul>

                `;

            // Load Study Materials (assuming a 'lessons' or 'materials' subcollection under batches)
            const materialsQuery = query(collection(db, "batches", batchId, "materials")); // Example path
            const materialDocs = await getDocs(materialsQuery);
            const studyMaterialsList = document.getElementById('studyMaterialsList');
            if (!materialDocs.empty) {
                materialDocs.forEach(materialDoc => {
                    const material = materialDoc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${material.url}" target="_blank">${material.title} (${material.type})</a>`;
                    studyMaterialsList.appendChild(li);
                });
            } else {
                studyMaterialsList.innerHTML = '<li>No study materials available yet.</li>';
            }

            // Load Assignments (assuming an 'assignments' subcollection under batches)
            const assignmentsQuery = query(collection(db, "batches", batchId, "assignments")); // Example path
            const assignmentDocs = await getDocs(assignmentsQuery);
            const assignmentsList = document.getElementById('assignmentsList');
            if (!assignmentDocs.empty) {
                assignmentsList.forEach(assignmentDoc => {
                    const assignment = assignmentDoc.data();
                    const li = document.createElement('li');
                    // You'd add logic here for submission, status, etc.
                    li.innerHTML = `
                        <strong>${assignment.title}</strong> - Due: ${new Date(assignment.dueDate.seconds * 1000).toLocaleDateString()}
                        <a href="${assignment.materialUrl}" target="_blank">View Assignment</a>
                        `;
                    assignmentsList.appendChild(li);
                });
            } else {
                assignmentsList.innerHTML = '<li>No assignments posted yet.</li>';
            }

        } catch (error) {
            console.error("Error loading batch details:", error);
            batchDetailsContainer.innerHTML = `<p class="error">Failed to load batch details: ${error.message}</p>`;
        }
    }
}
// user.js (add this to the end of the file)

// --- Registration Page Logic (`user-register.html`) ---
const userRegistrationForm = document.getElementById('userRegistrationForm');
const registerButton = document.getElementById('registerButton');
const registrationMessage = document.getElementById('registrationMessage');


if (userRegistrationForm) {
    userRegistrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(registrationMessage);
        registerButton.disabled = true;

        const name = userRegistrationForm['regName'].value;
        const email = userRegistrationForm['regEmail'].value;
        const password = userRegistrationForm['regPassword'].value;

        try {
            // Call the registerUser function from auth.js
            await registerUser(email, password, name, 'student'); // Default role is 'student'
            displayMessage(registrationMessage, "Registration successful! You can now log in.", "success");
            userRegistrationForm.reset();
            // Optionally, redirect to login page after successful registration
            setTimeout(() => {
                window.location.href = 'user-login.html';
            }, 2000);
        } catch (error) {
            let errorMessage = "Registration failed.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            }
            displayMessage(registrationMessage, errorMessage, "error");
        } finally {
            registerButton.disabled = false;
        }
    });
}
