// js/user.js

import { auth, db } from './firebase-init.js';
import { setupAuthProtection } from './auth.js';
import { collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Call auth protection for user pages
setupAuthProtection('user-login.html', false);

const batchListContainer = document.getElementById('batchList');
const enrollmentMessage = document.getElementById('enrollmentMessage');
const myEnrollmentListContainer = document.getElementById('myEnrollmentList');

let currentUserId = null;

// Get current user ID once authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        // Fetch data once user is confirmed
        if (batchListContainer) {
            fetchBatches();
        }
        if (myEnrollmentListContainer) {
            fetchMyEnrollments();
        }
    }
});


// --- Fetch and Display Batches on User Home Page ---
async function fetchBatches() {
    if (!batchListContainer) return; // Only run if on the correct page

    batchListContainer.innerHTML = '<p>Loading batches...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "batches"));
        let batchesHtml = '';
        if (querySnapshot.empty) {
            batchesHtml = '<p>No batches available yet.</p>';
        } else {
            const batchPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const batch = docSnapshot.data();
                const batchId = docSnapshot.id;

                // Check if user has already requested or is enrolled in this batch
                const q = query(collection(db, "enrollmentRequests"),
                                where("userId", "==", currentUserId),
                                where("batchId", "==", batchId));
                const existingRequest = await getDocs(q);

                let buttonHtml = '';
                if (!existingRequest.empty) {
                    const requestStatus = existingRequest.docs[0].data().status;
                    if (requestStatus === 'pending') {
                        buttonHtml = `<button disabled>Request Pending</button>`;
                    } else if (requestStatus === 'approved') {
                        buttonHtml = `<button disabled style="background-color: #5cb85c;">Enrolled!</button>`;
                    } else if (requestStatus === 'denied') {
                        buttonHtml = `<button disabled style="background-color: #f0ad4e;">Request Denied</button>`;
                    }
                } else {
                    buttonHtml = `<button data-batch-id="${batchId}">Request Enrollment</button>`;
                }

                return `
                    <div class="batch-card">
                        <h3>${batch.name}</h3>
                        <p>${batch.description}</p>
                        <p>Starts: ${batch.startDate || 'N/A'}</p>
                        ${buttonHtml}
                    </div>
                `;
            });
            const resolvedBatchesHtml = await Promise.all(batchPromises);
            batchesHtml = resolvedBatchesHtml.join('');
        }
        batchListContainer.innerHTML = batchesHtml;

        // Add event listeners after batches are rendered
        document.querySelectorAll('.batch-card button[data-batch-id]').forEach(button => {
            button.addEventListener('click', sendEnrollmentRequest);
        });

    } catch (error) {
        console.error("Error fetching batches:", error);
        batchListContainer.innerHTML = '<p class="message error">Error loading batches. Please try again.</p>';
    }
}

// --- Send Enrollment Request ---
async function sendEnrollmentRequest(event) {
    const batchId = event.target.dataset.batchId;
    if (!currentUserId) {
        enrollmentMessage.className = 'message error';
        enrollmentMessage.textContent = 'Please log in to send a request.';
        return;
    }

    try {
        await addDoc(collection(db, "enrollmentRequests"), {
            userId: currentUserId,
            batchId: batchId,
            status: 'pending', // 'pending', 'approved', 'denied'
            requestDate: new Date()
        });
        enrollmentMessage.className = 'message success';
        enrollmentMessage.textContent = 'Enrollment request sent successfully!';
        event.target.disabled = true; // Disable button
        event.target.textContent = 'Request Pending'; // Update button text
        setTimeout(() => enrollmentMessage.textContent = '', 3000); // Clear message
    } catch (error) {
        console.error("Error sending enrollment request:", error);
        enrollmentMessage.className = 'message error';
        enrollmentMessage.textContent = 'Failed to send request: ' + error.message;
    }
}


// --- Fetch and Display User's Enrollments on My Batches Page ---
async function fetchMyEnrollments() {
    if (!myEnrollmentListContainer || !currentUserId) return;

    myEnrollmentListContainer.innerHTML = '<p>Loading your enrollments...</p>';
    try {
        const q = query(collection(db, "enrollmentRequests"), where("userId", "==", currentUserId));
        const querySnapshot = await getDocs(q);

        let myEnrollmentsHtml = '';
        if (querySnapshot.empty) {
            myEnrollmentsHtml = '<p>You have no pending or approved enrollments.</p>';
        } else {
            const enrollmentPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const request = docSnapshot.data();
                const batchDoc = await getDoc(doc(db, "batches", request.batchId));
                if (!batchDoc.exists()) return ''; // Skip if batch not found

                const batch = batchDoc.data();
                let statusText = '';
                let contentButton = '';

                switch (request.status) {
                    case 'pending':
                        statusText = '<span style="color: orange;">Pending Admin Approval</span>';
                        break;
                    case 'approved':
                        statusText = '<span style="color: green;">Approved!</span>';
                        // Placeholder for content access - you'd fetch subjects/chapters here
                        contentButton = `<button onclick="alert('Accessing content for ${batch.name} (Coming Soon)!')">Access Content</button>`;
                        // In a real app, you'd fetch subjects, chapters, videos, PDFs here
                        // For example:
                        // const subjectsQ = query(collection(db, "batches", request.batchId, "subjects"));
                        // const subjectsSnap = await getDocs(subjectsQ);
                        // subjectsSnap.forEach(subDoc => {
                        //    // Render subjects, then chapters, then videos/PDFs
                        // });
                        break;
                    case 'denied':
                        statusText = `<span style="color: red;">Denied</span>`;
                        if (request.denialReason) {
                            statusText += `<p>Reason: ${request.denialReason}</p>`;
                        }
                        break;
                }

                return `
                    <div class="batch-card">
                        <h3>${batch.name}</h3>
                        <p>Request Status: ${statusText}</p>
                        ${contentButton}
                    </div>
                `;
            });
            const resolvedEnrollmentsHtml = await Promise.all(enrollmentPromises);
            myEnrollmentsHtml = resolvedEnrollmentsHtml.join('');
        }
        myEnrollmentListContainer.innerHTML = myEnrollmentsHtml;

    } catch (error) {
        console.error("Error fetching my enrollments:", error);
        myEnrollmentListContainer.innerHTML = '<p class="message error">Error loading your enrollments. Please try again.</p>';
    }
}
