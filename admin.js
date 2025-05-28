// admin.js

import { loginUser, logoutUser, setupAuthListener, isAdmin, registerUser } from './auth.js'; import { db, storage } from './firebase-init.js'; import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore"; import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- DOM Elements --- const adminLoginForm = document.getElementById('adminLoginForm'); const adminLoginMessage = document.getElementById('adminLoginMessage'); const adminLoginButton = document.getElementById('adminLoginButton');

const adminLogoutButton = document.getElementById('adminLogoutButton'); const adminDashboardStats = document.getElementById('adminDashboardStats'); const userCountDisplay = document.getElementById('userCountDisplay'); const batchCountDisplay = document.getElementById('batchCountDisplay');

const manageUsersSection = document.getElementById('manageUsersSection'); const userList = document.getElementById('userList'); const addUserForm = document.getElementById('addUserForm'); const addUserMessage = document.getElementById('addUserMessage');

const manageBatchesSection = document.getElementById('manageBatchesSection'); const batchList = document.getElementById('batchList'); const addBatchForm = document.getElementById('addBatchForm'); const addBatchMessage = document.getElementById('addBatchMessage');

const manageSubjectsSection = document.getElementById('manageSubjectsSection'); const subjectList = document.getElementById('subjectList'); const addSubjectForm = document.getElementById('addSubjectForm'); const addSubjectMessage = document.getElementById('addSubjectMessage');

const manageChaptersSection = document.getElementById('manageChaptersSection'); const chapterList = document.getElementById('chapterList'); const addChapterForm = document.getElementById('addChapterForm'); const addChapterMessage = document.getElementById('addChapterMessage');

const manageContentSection = document.getElementById('manageContentSection'); const addContentForm = document.getElementById('addContentForm'); const addContentMessage = document.getElementById('addContentMessage');

// --- Helper for messages --- function displayMessage(element, message, type) { element.textContent = message; element.className = message ${type}; element.style.display = 'block'; }

function clearMessage(element) { element.textContent = ''; element.className = 'message'; element.style.display = 'none'; }

// --- Admin Login Page Logic --- if (adminLoginForm) { adminLoginForm.addEventListener('submit', async (e) => { e.preventDefault(); clearMessage(adminLoginMessage); adminLoginButton.disabled = true;

const email = adminLoginForm['adminEmail'].value;
    const password = adminLoginForm['adminPassword'].value;

    try {
        const userData = await loginUser(email, password);
        if (userData && userData.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
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

// --- Admin Dashboard Logic --- if (adminLogoutButton) { setupAuthListener(async (user) => { if (user && user.role === 'admin') { document.getElementById('adminDisplayName').textContent = user.displayName || user.email; await loadAdminDashboardData(); } else { window.location.href = 'admin-login.html'; } });

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
        const usersSnapshot = await getDocs(collection(db, "users"));
        userCountDisplay.textContent = usersSnapshot.size;

        const batchesSnapshot = await getDocs(collection(db, "batches"));
        batchCountDisplay.textContent = batchesSnapshot.size;

        await loadUsers();
        await loadBatches();
        await loadSubjects();
        await loadChapters();

    } catch (error) {
        console.error("Error loading admin dashboard data:", error);
        adminDashboardStats.innerHTML = '<p class="error">Failed to load dashboard data.</p>';
    }
}

// Existing user and batch management functions stay the same

// --- Subject Management ---
async function loadSubjects() {
    subjectList.innerHTML = '<li>Loading subjects...</li>';
    try {
        const q = query(collection(db, "subjects"));
        const querySnapshot = await getDocs(q);
        subjectList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const subject = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span>${subject.name}</span>`;
            subjectList.appendChild(li);
        });
        if (querySnapshot.empty) subjectList.innerHTML = '<li>No subjects found.</li>';
    } catch (error) {
        console.error("Error loading subjects:", error);
        subjectList.innerHTML = '<li class="error">Failed to load subjects.</li>';
    }
}

if (addSubjectForm) {
    addSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(addSubjectMessage);
        const name = addSubjectForm['newSubjectName'].value;
        try {
            await addDoc(collection(db, "subjects"), {
                name,
                createdAt: serverTimestamp()
            });
            displayMessage(addSubjectMessage, "Subject added successfully!", "success");
            addSubjectForm.reset();
            loadSubjects();
        } catch (error) {
            displayMessage(addSubjectMessage, "Error adding subject: " + error.message, "error");
        }
    });
}

// --- Chapter Management ---
async function loadChapters() {
    chapterList.innerHTML = '<li>Loading chapters...</li>';
    try {
        const q = query(collection(db, "chapters"));
        const querySnapshot = await getDocs(q);
        chapterList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const chapter = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span>${chapter.name} (Subject: ${chapter.subjectId})</span>`;
            chapterList.appendChild(li);
        });
        if (querySnapshot.empty) chapterList.innerHTML = '<li>No chapters found.</li>';
    } catch (error) {
        console.error("Error loading chapters:", error);
        chapterList.innerHTML = '<li class="error">Failed to load chapters.</li>';
    }
}

if (addChapterForm) {
    addChapterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(addChapterMessage);
        const name = addChapterForm['newChapterName'].value;
        const subjectId = addChapterForm['newChapterSubjectId'].value;
        try {
            await addDoc(collection(db, "chapters"), {
                name,
                subjectId,
                createdAt: serverTimestamp()
            });
            displayMessage(addChapterMessage, "Chapter added successfully!", "success");
            addChapterForm.reset();
            loadChapters();
        } catch (error) {
            displayMessage(addChapterMessage, "Error adding chapter: " + error.message, "error");
        }
    });
}

// --- Add Video/PDF inside Chapter ---
if (addContentForm) {
    addContentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(addContentMessage);
        const chapterId = addContentForm['contentChapterId'].value;
        const type = addContentForm['contentType'].value;
        const title = addContentForm['contentTitle'].value;
        const file = addContentForm['contentFile'].files[0];

        try {
            const storageRef = ref(storage, `chapters/${chapterId}/${type}s/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await addDoc(collection(db, "chapters", chapterId, type === 'video' ? 'videos' : 'pdfs'), {
                title,
                url: downloadURL,
                fileName: file.name,
                uploadedAt: serverTimestamp()
            });

            displayMessage(addContentMessage, `${type.toUpperCase()} added successfully!`, "success");
            addContentForm.reset();
        } catch (error) {
            displayMessage(addContentMessage, "Error uploading content: " + error.message, "error");
        }
    });
}

}

