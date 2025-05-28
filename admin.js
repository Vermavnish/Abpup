// js/admin.js

import { auth, db } from './firebase-init.js';
import { setupAuthProtection } from './auth.js';
import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const createBatchForm = document.getElementById('createBatchForm');
const batchMessage = document.getElementById('batchMessage');
const enrollmentRequestsList = document.getElementById('enrollmentRequestsList');
const requestActionMessage = document.getElementById('requestActionMessage');

// --- Admin Login Logic ---
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = adminLoginForm['adminEmail'].value;
        const password = adminLoginForm['adminPassword'].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // After successful login, check if the user is an admin in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                adminLoginMessage.className = 'message success';
                adminLoginMessage.textContent = 'Admin login successful! Redirecting...';
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
            } else {
                // Not an admin
                await auth.signOut(); // Log them out immediately
                adminLoginMessage.className = 'message error';
                adminLoginMessage.textContent = 'Access Denied: You are not an administrator.';
            }
        } catch (error) {
            adminLoginMessage.className = 'message error';
            adminLoginMessage.textContent = error.message;
            console.error("Admin Login error:", error);
        }
    });
}

// --- Admin Dashboard Logic ---
// Apply auth protection for admin dashboard
if (document.body.id === 'admin-dashboard') { // You could add an ID to the body of admin-dashboard.html
    setupAuthProtection('admin-login.html', true); // True means it will check for isAdmin flag
    fetchPendingEnrollmentRequests(); // Load requests on dashboard load
}

// --- Create Batch Form Submission ---
if (createBatchForm) {
    createBatchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = createBatchForm['batchName'].value;
        const description = createBatchForm['batchDescription'].value;
        const startDate = createBatchForm['batchStartDate'].value; // This will be YYYY-MM-DD

        try {
            await addDoc(collection(db, "batches"), {
                name: name,
                description: description,
                startDate: startDate,
                createdAt: new Date()
                // You can add more fields like 'capacity', 'price', etc.
            });
            batchMessage.className = 'message success';
            batchMessage.textContent = 'Batch created successfully!';
            createBatchForm.reset(); // Clear form
            setTimeout(() => batchMessage.textContent = '', 3000);
        } catch (error) {
            batchMessage.className = 'message error';
            batchMessage.textContent = 'Error creating batch: ' + error.message;
            console.error("Error creating batch:", error);
        }
    });
}

// --- Fetch and Display Pending Enrollment Requests ---
async function fetchPendingEnrollmentRequests() {
    if (!enrollmentRequestsList) return; // Only run if on the correct page

    enrollmentRequestsList.innerHTML = '<p>Loading pending requests...</p>';
    try {
        const q = query(collection(db, "enrollmentRequests"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        let requestsHtml = '';
        if (querySnapshot.empty) {
            requestsHtml = '<p>No pending enrollment requests.</p>';
        } else {
            const requestPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const request = docSnapshot.data();
                const requestId = docSnapshot.id;

                // Fetch user details
                const userDoc = await getDoc(doc(db, "users", request.userId));
                const userData = userDoc.exists() ? userDoc.data() : { username: 'Unknown User', email: 'N/A' };

                // Fetch batch details
                const batchDoc = await getDoc(doc(db, "batches", request.batchId));
                const batchData = batchDoc.exists() ? batchDoc.data() : { name: 'Unknown Batch' };

                return `
                    <div class="request-card">
                        <h3>${batchData.name}</h3>
                        <p>User: ${userData.username} (${userData.email})</p>
                        <p>Requested On: ${request.requestDate ? new Date(request.requestDate.toDate()).toLocaleDateString() : 'N/A'}</p>
                        <button class="approve-btn" data-request-id="${requestId}" data-user-id="${request.userId}" data-batch-id="${request.batchId}">Approve</button>
                        <button class="deny-btn" data-request-id="${requestId}">Deny</button>
                    </div>
                `;
            });
            const resolvedRequestsHtml = await Promise.all(requestPromises);
            requestsHtml = resolvedRequestsHtml.join('');
        }
        enrollmentRequestsList.innerHTML = requestsHtml;

        // Add event listeners for approve/deny buttons
        document.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', handleEnrollmentAction);
        });
        document.querySelectorAll('.deny-btn').forEach(button => {
            button.addEventListener('click', handleEnrollmentAction);
        });

    } catch (error) {
        console.error("Error fetching pending requests:", error);
        enrollmentRequestsList.innerHTML = '<p class="message error">Error loading requests. Please try again.</p>';
    }
}

// --- Handle Approve/Deny Action ---
async function handleEnrollmentAction(event) {
    const requestId = event.target.dataset.requestId;
    const action = event.target.classList.contains('approve-btn') ? 'approved' : 'denied';

    try {
        const requestDocRef = doc(db, "enrollmentRequests", requestId);
        await updateDoc(requestDocRef, { status: action });

        if (action === 'approved') {
            requestActionMessage.className = 'message success';
            requestActionMessage.textContent = `Request ${requestId} approved!`;
            // Optional: You could also add a reference to the user's document for approved batches
            // e.g., await updateDoc(doc(db, "users", event.target.dataset.userId), {
            //     [`enrolledBatches.${event.target.dataset.batchId}`]: true
            // });
        } else {
            requestActionMessage.className = 'message error';
            requestActionMessage.textContent = `Request ${requestId} denied.`;
            // Optional: Ask for denial reason here with a prompt or modal
            // const reason = prompt("Enter reason for denial (optional):");
            // if (reason) {
            //     await updateDoc(requestDocRef, { denialReason: reason });
            // }
        }

        // Re-fetch requests to update the list
        fetchPendingEnrollmentRequests();
        setTimeout(() => requestActionMessage.textContent = '', 3000);

    } catch (error) {
        console.error(`Error ${action} request:`, error);
        requestActionMessage.className = 'message error';
        requestActionMessage.textContent = `Failed to ${action} request: ` + error.message;
    }
}

// Ensure the admin dashboard loads requests if the user is already logged in
// This is done by the setupAuthProtection in auth.js which will call fetchPendingEnrollmentRequests if applicable.
