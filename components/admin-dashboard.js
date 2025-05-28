// components/admin-dashboard.js
import { logoutUser, ADMIN_EMAIL } from '../utils/auth.js';
import {
    createBatch, getBatches, deleteBatch,
    createSubject, getSubjects, deleteSubject,
    createChapter, getChapters, deleteChapter,
    createContent, getContent, deleteContent
} from '../utils/firestore.js';
import { clearElement, createButton, createInput } from './common-ui.js';
import { db } from '../firebase-config.js'; // Firebase Firestore instance to get document names

// Global variables to keep track of selected IDs for hierarchical navigation
let currentSelectedBatchId = null;
let currentSelectedSubjectId = null;
let currentSelectedChapterId = null;

/**
 * Renders the main Admin Dashboard view.
 * @param {HTMLElement} appContainer - The main container element for the app.
 */
async function renderAdminDashboard(appContainer) {
    clearElement(appContainer);

    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';

    const header = document.createElement('div');
    header.className = 'dashboard-header';
    const title = document.createElement('h2');
    title.textContent = 'Admin Dashboard';
    header.appendChild(title);

    const logoutBtn = createButton('Logout', 'logout-button', async () => {
        await logoutUser();
        // The main script.js will handle redirect to login
    });
    header.appendChild(logoutBtn);
    dashboardContainer.appendChild(header);

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    dashboardContainer.appendChild(mainContent);

    appContainer.appendChild(dashboardContainer);

    // Initial render: show Batch Management
    renderBatchManagement(mainContent);
}

/**
 * Renders the Batch Management section.
 * @param {HTMLElement} container - The container element to render batches into.
 */
async function renderBatchManagement(container) {
    clearElement(container);
    container.innerHTML = '<h3>Batch Management</h3>';

    // Form to add new batch
    const batchForm = document.createElement('form');
    batchForm.className = 'input-form';
    const batchInput = createInput('text', 'Batch Name', 'form-input');
    batchForm.appendChild(batchInput);
    const addBatchBtn = createButton('Add Batch', 'form-button', async (e) => {
        e.preventDefault(); // Prevent page reload
        if (batchInput.value.trim()) {
            try {
                await createBatch(batchInput.value);
                batchInput.value = '';
                renderBatchManagement(container); // Re-render to show new batch
            } catch (error) {
                console.error("Error adding batch:", error);
                alert("Failed to add batch. Check console for details.");
            }
        } else {
            alert('Batch name cannot be empty.');
        }
    });
    batchForm.appendChild(addBatchBtn);
    container.appendChild(batchForm);

    // List of existing batches
    const batchList = document.createElement('div');
    batchList.className = 'list-container';
    container.appendChild(batchList);

    const batches = await getBatches(); // Fetch batches from Firestore
    if (batches.length === 0) {
        batchList.innerHTML = '<p>No batches created yet.</p>';
    } else {
        batches.forEach(batch => {
            const batchItem = document.createElement('div');
            batchItem.className = 'list-item';
            batchItem.innerHTML = `<span>${batch.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewSubjectsBtn = createButton('View Subjects', 'action-button', () => {
                currentSelectedBatchId = batch.id;
                renderSubjectManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete batch "${batch.name}"? This will also delete all subjects, chapters, and content within it!`)) {
                    try {
                        // TODO: Implement cascading delete in a robust way (e.g., Cloud Functions)
                        // For now, this just deletes the batch itself.
                        // You'd need to manually delete associated subjects, chapters, content for full cleanup.
                        await deleteBatch(batch.id);
                        renderBatchManagement(container); // Re-render
                    } catch (error) {
                        console.error("Error deleting batch:", error);
                        alert("Failed to delete batch. Check console for details.");
                    }
                }
            });
            actionsDiv.appendChild(viewSubjectsBtn);
            actionsDiv.appendChild(deleteBtn);
            batchItem.appendChild(actionsDiv);
            batchList.appendChild(batchItem);
        });
    }
}

/**
 * Renders the Subject Management section for a selected batch.
 * @param {HTMLElement} container - The container element to render subjects into.
 */
async function renderSubjectManagement(container) {
    if (!currentSelectedBatchId) {
        console.error("No batch selected for subject management.");
        renderBatchManagement(container); // Fallback to batch view
        return;
    }

    clearElement(container);
    // Fetch batch name for display
    const batchName = await getDocName('batches', currentSelectedBatchId) || 'Unknown Batch';
    container.innerHTML = `<h3>Subject Management for Batch: ${batchName}</h3>`;

    const backToBatchesBtn = createButton('Back to Batches', 'back-button', () => {
        currentSelectedBatchId = null;
        renderBatchManagement(container);
    });
    container.appendChild(backToBatchesBtn);

    // Form to add new subject
    const subjectForm = document.createElement('form');
    subjectForm.className = 'input-form';
    const subjectInput = createInput('text', 'Subject Name', 'form-input');
    subjectForm.appendChild(subjectInput);
    const addSubjectBtn = createButton('Add Subject', 'form-button', async (e) => {
        e.preventDefault();
        if (subjectInput.value.trim()) {
            try {
                await createSubject(currentSelectedBatchId, subjectInput.value);
                subjectInput.value = '';
                renderSubjectManagement(container); // Re-render
            } catch (error) {
                console.error("Error adding subject:", error);
                alert("Failed to add subject. Check console for details.");
            }
        } else {
            alert('Subject name cannot be empty.');
        }
    });
    subjectForm.appendChild(addSubjectBtn);
    container.appendChild(subjectForm);

    // List of existing subjects
    const subjectList = document.createElement('div');
    subjectList.className = 'list-container';
    container.appendChild(subjectList);

    const subjects = await getSubjects(currentSelectedBatchId); // Fetch subjects for this batch
    if (subjects.length === 0) {
        subjectList.innerHTML = '<p>No subjects created yet for this batch.</p>';
    } else {
        subjects.forEach(subject => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'list-item';
            subjectItem.innerHTML = `<span>${subject.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewChaptersBtn = createButton('View Chapters', 'action-button', () => {
                currentSelectedSubjectId = subject.id;
                renderChapterManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete subject "${subject.name}"? This will also delete all chapters and content within it!`)) {
                    try {
                        // TODO: Implement cascading delete
                        await deleteSubject(subject.id);
                        renderSubjectManagement(container); // Re-render
                    } catch (error) {
                        console.error("Error deleting subject:", error);
                        alert("Failed to delete subject. Check console for details.");
                    }
                }
            });
            actionsDiv.appendChild(viewChaptersBtn);
            actionsDiv.appendChild(deleteBtn);
            subjectItem.appendChild(actionsDiv);
            subjectList.appendChild(subjectItem);
        });
    }
}

/**
 * Renders the Chapter Management section for a selected subject.
 * @param {HTMLElement} container - The container element to render chapters into.
 */
async function renderChapterManagement(container) {
    if (!currentSelectedSubjectId) {
        console.error("No subject selected for chapter management.");
        renderSubjectManagement(container); // Fallback to subject view
        return;
    }

    clearElement(container);
    // Fetch subject name for display
    const subjectName = await getDocName('subjects', currentSelectedSubjectId) || 'Unknown Subject';
    container.innerHTML = `<h3>Chapter Management for Subject: ${subjectName}</h3>`;

    const backToSubjectsBtn = createButton('Back to Subjects', 'back-button', () => {
        currentSelectedSubjectId = null;
        renderSubjectManagement(container);
    });
    container.appendChild(backToSubjectsBtn);

    // Form to add new chapter
    const chapterForm = document.createElement('form');
    chapterForm.className = 'input-form';
    const chapterInput = createInput('text', 'Chapter Name', 'form-input');
    chapterForm.appendChild(chapterInput);
    const addChapterBtn = createButton('Add Chapter', 'form-button', async (e) => {
        e.preventDefault();
        if (chapterInput.value.trim()) {
            try {
                await createChapter(currentSelectedSubjectId, chapterInput.value);
                chapterInput.value = '';
                renderChapterManagement(container); // Re-render
            } catch (error) {
                console.error("Error adding chapter:", error);
                alert("Failed to add chapter. Check console for details.");
            }
        } else {
            alert('Chapter name cannot be empty.');
        }
    });
    chapterForm.appendChild(addChapterBtn);
    container.appendChild(chapterForm);

    // List of existing chapters
    const chapterList = document.createElement('div');
    chapterList.className = 'list-container';
    container.appendChild(chapterList);

    const chapters = await getChapters(currentSelectedSubjectId); // Fetch chapters for this subject
    if (chapters.length === 0) {
        chapterList.innerHTML = '<p>No chapters created yet for this subject.</p>';
    } else {
        chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'list-item';
            chapterItem.innerHTML = `<span>${chapter.name}</span>`;

            const actionsDiv = document.createElement('div');
            const viewContentBtn = createButton('View Content', 'action-button', () => {
                currentSelectedChapterId = chapter.id;
                renderContentManagement(container);
            });
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete chapter "${chapter.name}"? This will also delete all content within it!`)) {
                    try {
                        // TODO: Implement cascading delete
                        await deleteChapter(chapter.id);
                        renderChapterManagement(container); // Re-render
                    } catch (error) {
                        console.error("Error deleting chapter:", error);
                        alert("Failed to delete chapter. Check console for details.");
                    }
                }
            });
            actionsDiv.appendChild(viewContentBtn);
            actionsDiv.appendChild(deleteBtn);
            chapterItem.appendChild(actionsDiv);
            chapterList.appendChild(chapterItem);
        });
    }
}

/**
 * Renders the Content Management section for a selected chapter.
 * @param {HTMLElement} container - The container element to render content into.
 */
async function renderContentManagement(container) {
    if (!currentSelectedChapterId) {
        console.error("No chapter selected for content management.");
        renderChapterManagement(container); // Fallback to chapter view
        return;
    }

    clearElement(container);
    // Fetch chapter name for display
    const chapterName = await getDocName('chapters', currentSelectedChapterId) || 'Unknown Chapter';
    container.innerHTML = `<h3>Content Management for Chapter: ${chapterName}</h3>`;

    const backToChaptersBtn = createButton('Back to Chapters', 'back-button', () => {
        currentSelectedChapterId = null;
        renderChapterManagement(container);
    });
    container.appendChild(backToChaptersBtn);

    // Form to add new content
    const contentForm = document.createElement('form');
    contentForm.className = 'input-form';

    const urlInput = createInput('text', 'Video/PDF URL', 'form-input');
    urlInput.setAttribute('required', 'true'); // Make URL required
    contentForm.appendChild(urlInput);

    const typeSelect = document.createElement('select');
    typeSelect.className = 'form-input';
    const videoOption = document.createElement('option');
    videoOption.value = 'video';
    videoOption.textContent = 'Video';
    const pdfOption = document.createElement('option');
    pdfOption.value = 'pdf';
    pdfOption.textContent = 'PDF';
    typeSelect.appendChild(videoOption);
    typeSelect.appendChild(pdfOption);
    contentForm.appendChild(typeSelect);

    const descriptionInput = createInput('text', 'Description (Optional)', 'form-input');
    contentForm.appendChild(descriptionInput);

    const addContentBtn = createButton('Add Content', 'form-button', async (e) => {
        e.preventDefault();
        if (urlInput.value.trim()) {
            try {
                await createContent(currentSelectedChapterId, typeSelect.value, urlInput.value, descriptionInput.value);
                urlInput.value = '';
                descriptionInput.value = '';
                renderContentManagement(container); // Re-render
            } catch (error) {
                console.error("Error adding content:", error);
                alert("Failed to add content. Check console for details.");
            }
        } else {
            alert('URL cannot be empty.');
        }
    });
    contentForm.appendChild(addContentBtn);
    container.appendChild(contentForm);

    // List of existing content
    const contentList = document.createElement('div');
    contentList.className = 'content-list';
    container.appendChild(contentList);

    const contentItems = await getContent(currentSelectedChapterId); // Fetch content for this chapter
    if (contentItems.length === 0) {
        contentList.innerHTML = '<p>No content added yet for this chapter.</p>';
    } else {
        contentItems.forEach(item => {
            const contentItemDiv = document.createElement('div');
            contentItemDiv.className = 'content-item';
            contentItemDiv.innerHTML = `<h4>${item.type.toUpperCase()}</h4>`;
            if (item.description) {
                contentItemDiv.innerHTML += `<p><strong>Desc:</strong> ${item.description}</p>`;
            }

            // Display content based on type
            if (item.type === 'video') {
                // Basic check for YouTube. More robust parsing is needed for other platforms.
                let embedUrl = item.url;
                if (item.url.includes("youtube.com/watch?v=")) {
                    const videoId = item.url.split('v=')[1].split('&')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else if (item.url.includes("youtu.be/")) {
                    const videoId = item.url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                // Add more conditions for Vimeo etc.

                contentItemDiv.innerHTML += `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                contentItemDiv.innerHTML += `<p><a href="${item.url}" target="_blank">Watch Video (Original Link)</a></p>`;

            } else if (item.type === 'pdf') {
                contentItemDiv.innerHTML += `<iframe src="${item.url}" width="100%" height="500px"></iframe>`;
                contentItemDiv.innerHTML += `<p><a href="${item.url}" target="_blank">Open PDF in new tab</a></p>`;
            } else {
                contentItemDiv.innerHTML += `<p>Direct Link: <a href="${item.url}" target="_blank">${item.url}</a></p>`;
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.style.marginTop = '10px';
            const deleteBtn = createButton('Delete', 'delete-button', async () => {
                if (confirm(`Are you sure you want to delete this ${item.type} content?`)) {
                    try {
                        await deleteContent(item.id);
                        renderContentManagement(container); // Re-render
                    } catch (error) {
                        console.error("Error deleting content:", error);
                        alert("Failed to delete content. Check console for details.");
                    }
                }
            });
            actionsDiv.appendChild(deleteBtn);
            contentItemDiv.appendChild(actionsDiv);
            contentList.appendChild(contentItemDiv);
        });
    }
}

/**
 * Helper function to get a document's name from Firestore for display purposes.
 * @param {string} collectionName - The name of the collection (e.g., 'batches', 'subjects').
 * @param {string} docId - The ID of the document.
 * @returns {Promise<string>} The name of the document or undefined if not found.
 */
async function getDocName(collectionName, docId) {
    try {
        const doc = await db.collection(collectionName).doc(docId).get();
        return doc.exists ? doc.data().name : undefined;
    } catch (error) {
        console.error(`Error fetching name for ${collectionName}/${docId}:`, error);
        return undefined;
    }
}

export { renderAdminDashboard };
