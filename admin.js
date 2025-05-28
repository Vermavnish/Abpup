// admin.js

import { loginUser, logoutUser, setupAuthListener, isAdmin, registerUser } from './auth.js';
import { db, storage } from './firebase-init.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp // For adding timestamps
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- DOM Elements ---
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const adminLoginButton = document.getElementById('adminLoginButton');

const adminLogoutButton = document.getElementById('adminLogoutButton');
const adminDashboardStats = document.getElementById('adminDashboardStats');
const userCountDisplay = document.getElementById('userCountDisplay');
const batchCountDisplay = document.getElementById('batchCountDisplay');

const manageUsersSection = document.getElementById('manageUsersSection');
const userList = document.getElementById('userList');
const addUserForm = document.getElementById('addUserForm');
const addUserMessage = document.getElementById('addUserMessage');

const manageBatchesSection = document.getElementById('manageBatchesSection');
const batchList = document.getElementById('batchList');
const addBatchForm = document.getElementById('addBatchForm');
const addBatchMessage = document.getElementById('addBatchMessage');


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


// --- Admin Login Page Logic (`admin-login.html`) ---
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(adminLoginMessage);
        adminLoginButton.disabled = true;

        const email = adminLoginForm['adminEmail'].value;
        const password = adminLoginForm['adminPassword'].value;

        try {
            const userData = await loginUser(email, password); // Use the general login
            if (userData && userData.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                // If a non-admin tries to login here, log them out
                await logoutUser();
                displayMessage(adminLoginMessage, "Access Denied: You do not have admin privileges.", "error");
            }
        } catch (error) {
            let errorMessage = "Admin login failed. Invalid credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password for admin.";
            }
            displayMessage(adminLoginMessage, errorMessage, "error");
        } finally {
            adminLoginButton.disabled = false;
        }
    });
}

// --- Admin Dashboard Logic (`admin-dashboard.html`) ---
if (adminLogoutButton) {
    setupAuthListener(async (user) => {
        if (user && user.role === 'admin') {
            // User is an admin, load dashboard data
            document.getElementById('adminDisplayName').textContent = user.displayName || user.email;
            await loadAdminDashboardData();
        } else {
            // Not an admin or logged out, redirect to admin login
            window.location.href = 'admin-login.html';
        }
    });

    adminLogoutButton.addEventListener('click', async () => {
        try {
            await logoutUser();
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error("Admin logout failed:", error);
            alert("Admin logout failed. Please try again.");
        }
    });

    async function loadAdminDashboardData() {
        try {
            // Fetch user count
            const usersSnapshot = await getDocs(collection(db, "users"));
            userCountDisplay.textContent = usersSnapshot.size;

            // Fetch batch count
            const batchesSnapshot = await getDocs(collection(db, "batches"));
            batchCountDisplay.textContent = batchesSnapshot.size;

            // Load and display users for management
            await loadUsers();
            // Load and display batches for management
            await loadBatches();

        } catch (error) {
            console.error("Error loading admin dashboard data:", error);
            adminDashboardStats.innerHTML = '<p class="error">Failed to load dashboard data.</p>';
        }
    }

    // --- User Management ---
    async function loadUsers() {
        userList.innerHTML = '<li>Loading users...</li>';
        try {
            const q = query(collection(db, "users"));
            const querySnapshot = await getDocs(q);
            userList.innerHTML = ''; // Clear existing
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${user.displayName || user.email} (${user.role})</span>
                    <div>
                        <button onclick="editUser('${doc.id}')">Edit</button>
                        <button onclick="deleteUser('${doc.id}')">Delete</button>
                    </div>
                `;
                userList.appendChild(li);
            });
            if (querySnapshot.empty) {
                userList.innerHTML = '<li>No users found.</li>';
            }
        } catch (error) {
            console.error("Error loading users:", error);
            userList.innerHTML = '<li class="error">Failed to load users.</li>';
        }
    }

    // Example functions for user management (implement modals/forms for details)
    window.editUser = async (userId) => {
        alert("Edit user functionality for " + userId + " will be implemented here.");
        // Implement a modal or new page to edit user details
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            console.log("Editing user:", userDoc.data());
            // Populate a form with userDoc.data()
        }
    };

    window.deleteUser = async (userId) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "users", userId));
                alert("User deleted successfully!");
                loadUsers(); // Reload list
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Failed to delete user: " + error.message);
            }
        }
    };

    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(addUserMessage);
            const email = addUserForm['newUserEmail'].value;
            const password = addUserForm['newUserPassword'].value;
            const displayName = addUserForm['newUserName'].value;
            const role = addUserForm['newUserRole'].value;

            try {
                // Use the auth.js register function, passing the role
                await registerUser(email, password, displayName, role);
                displayMessage(addUserMessage, "User added successfully!", "success");
                addUserForm.reset();
                loadUsers(); // Reload user list
            } catch (error) {
                displayMessage(addUserMessage, "Error adding user: " + error.message, "error");
            }
        });
    }

    // --- Batch/Course Management ---
    async function loadBatches() {
        batchList.innerHTML = '<li>Loading batches...</li>';
        try {
            const q = query(collection(db, "batches"));
            const querySnapshot = await getDocs(q);
            batchList.innerHTML = ''; // Clear existing
            querySnapshot.forEach((doc) => {
                const batch = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${batch.name} (Course: ${batch.courseName || 'N/A'})</span>
                    <div>
                        <button onclick="editBatch('${doc.id}')">Edit</button>
                        <button onclick="deleteBatch('${doc.id}')">Delete</button>
                    </div>
                `;
                batchList.appendChild(li);
            });
            if (querySnapshot.empty) {
                batchList.innerHTML = '<li>No batches found.</li>';
            }
        } catch (error) {
            console.error("Error loading batches:", error);
            batchList.innerHTML = '<li class="error">Failed to load batches.</li>';
        }
    }

    window.editBatch = async (batchId) => {
        alert("Edit batch functionality for " + batchId + " will be implemented here.");
        const batchDoc = await getDoc(doc(db, "batches", batchId));
        if (batchDoc.exists()) {
            console.log("Editing batch:", batchDoc.data());
            // Populate a form with batchDoc.data()
        }
    };

    window.deleteBatch = async (batchId) => {
        if (confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "batches", batchId));
                alert("Batch deleted successfully!");
                loadBatches(); // Reload list
            } catch (error) {
                console.error("Error deleting batch:", error);
                alert("Failed to delete batch: " + error.message);
            }
        }
    };

    if (addBatchForm) {
        addBatchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessage(addBatchMessage);

            const batchName = addBatchForm['newBatchName'].value;
            const courseName = addBatchForm['newBatchCourseName'].value;
            const instructor = addBatchForm['newBatchInstructor'].value;
            const startDate = addBatchForm['newBatchStartDate'].value;
            const description = addBatchForm['newBatchDescription'].value;

            try {
                await addDoc(collection(db, "batches"), {
                    name: batchName,
                    courseName: courseName,
                    instructor: instructor,
                    startDate: new Date(startDate), // Convert to Firestore Timestamp
                    description: description,
                    createdAt: serverTimestamp()
                });
                displayMessage(addBatchMessage, "Batch added successfully!", "success");
                addBatchForm.reset();
                loadBatches(); // Reload batch list
            } catch (error) {
                displayMessage(addBatchMessage, "Error adding batch: " + error.message, "error");
            }
        });
    }

    // --- Example of file upload (e.g., for study materials) ---
    // You'd integrate this into a separate 'Upload Materials' section
    // async function uploadStudyMaterial(file, batchId, title) {
    //     try {
    //         const storageRef = ref(storage, `batches/${batchId}/materials/${file.name}`);
    //         const snapshot = await uploadBytes(storageRef, file);
    //         const downloadURL = await getDownloadURL(snapshot.ref);
    //
    //         // Save material metadata to Firestore
    //         await addDoc(collection(db, "batches", batchId, "materials"), {
    //             title: title,
    //             url: downloadURL,
    //             fileName: file.name,
    //             uploadedAt: serverTimestamp()
    //         });
    //         console.log("Material uploaded and linked:", downloadURL);
    //         return downloadURL;
    //     } catch (error) {
    //         console.error("Error uploading material:", error);
    //         throw error;
    //     }
    // }
}
